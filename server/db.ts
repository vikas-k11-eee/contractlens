import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  contracts,
  documents,
  alerts,
  obligations,
  userSettings,
  users,
  workspaces,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getEmptyDashboard, type DashboardData } from "./contractData";
import type { Contract } from "./contractData";
import { storagePut } from "./storage";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "profileImage"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db
    .insert(users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function getOrCreateWorkspace(
  user: Pick<typeof users.$inferSelect, "id" | "name">
) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerId, user.id))
    .limit(1);
  if (existing[0]) return existing[0];
  const name = `${user.name?.trim() || "Personal"}'s Workspace`;
  const result = await db.insert(workspaces).values({ ownerId: user.id, name });
  const created = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, Number(result[0].insertId)))
    .limit(1);
  return created[0];
}

export async function getOrCreateUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];
  const result = await db.insert(userSettings).values({ userId });
  const created = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.id, Number(result[0].insertId)))
    .limit(1);
  return created[0];
}

export async function getAccountContext(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user[0]) return undefined;
  const workspace = await getOrCreateWorkspace(user[0]);
  const settings = await getOrCreateUserSettings(userId);
  return { user: user[0], workspace, settings };
}

export async function updateUserProfile(
  userId: number,
  input: { name?: string }
) {
  const db = await getDb();
  if (!db) return undefined;
  await db
    .update(users)
    .set({ name: input.name?.trim() || null })
    .where(eq(users.id, userId));
  return getAccountContext(userId);
}

export async function updateUserSettings(
  userId: number,
  input: Partial<{
    emailNotifications: boolean;
    deadlineAlerts: boolean;
    renewalAlerts: boolean;
    overdueAlerts: boolean;
    weeklySummary: boolean;
  }>
) {
  const db = await getDb();
  if (!db) return undefined;
  await getOrCreateUserSettings(userId);
  await db
    .update(userSettings)
    .set(input)
    .where(eq(userSettings.userId, userId));
  return getAccountContext(userId);
}

export async function listWorkspaceContracts(
  workspaceId: number,
  search = "",
  status = "all"
) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(contracts)
    .where(eq(contracts.workspaceId, workspaceId));
  const normalized = search.trim().toLowerCase();
  return rows.filter(contract => {
    const matchesSearch =
      !normalized ||
      `${contract.name} ${contract.contractType} ${contract.ownerName ?? ""}`
        .toLowerCase()
        .includes(normalized);
    const matchesStatus = status === "all" || contract.status === status;
    return matchesSearch && matchesStatus;
  });
}

export async function getWorkspaceContract(
  workspaceId: number,
  contractId: number
) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(contracts)
    .where(
      and(eq(contracts.id, contractId), eq(contracts.workspaceId, workspaceId))
    )
    .limit(1);
  return result[0];
}

export async function getWorkspaceDashboard(workspaceId: number) {
  const rows = await listWorkspaceContracts(workspaceId);
  const now = Date.now();
  const in120Days = now + 120 * 24 * 60 * 60 * 1000;
  return {
    metrics: {
      totalContracts: rows.length,
      activeContracts: rows.filter(row => row.status === "active").length,
      upcomingRenewals: rows.filter(
        row => row.renewalDate && row.renewalDate.getTime() <= in120Days
      ).length,
      obligationsDueSoon: 0,
      reviewRequired: rows.filter(row => row.status === "review").length,
      updatedThisWeek: rows.filter(
        row => row.updatedAt.getTime() >= now - 7 * 24 * 60 * 60 * 1000
      ).length,
    },
    contracts: rows,
  };
}

export async function listWorkspaceObligations(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(obligations)
    .where(eq(obligations.workspaceId, workspaceId));
}

export async function listWorkspaceAlerts(workspaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alerts).where(eq(alerts.workspaceId, workspaceId));
}

export async function getWorkspaceDashboardData(
  workspaceId: number
): Promise<DashboardData> {
  const rows = await listWorkspaceContracts(workspaceId);
  if (rows.length === 0) return getEmptyDashboard();
  const empty = getEmptyDashboard();
  return {
    ...empty,
    metrics: {
      ...empty.metrics,
      totalContracts: rows.length,
      activeContracts: rows.filter(row => row.status === "active").length,
      upcomingRenewals: rows.filter(row => row.renewalDate).length,
      reviewRequired: rows.filter(row => row.status === "review").length,
    },
  };
}

function toContractCard(
  row: typeof contracts.$inferSelect,
  documentName = ""
): Contract {
  const date = (value: Date | null) => value?.toISOString().slice(0, 10) ?? "";
  return {
    id: String(row.id),
    name: row.name,
    type: row.contractType,
    status: row.status,
    risk: row.riskLevel,
    parties: row.ownerName
      ? [{ name: row.ownerName, type: "Owner", role: "Contract owner" }]
      : [],
    effectiveDate: date(row.effectiveDate),
    expirationDate: date(row.expirationDate),
    renewalDate: date(row.renewalDate),
    noticeDeadline: "",
    owner: row.ownerName ?? "",
    lastUpdated: date(row.updatedAt),
    amount: "",
    paymentTerms: "",
    renewalTerms: "",
    terminationTerms: "",
    governingLaw: "",
    summary: "Contract uploaded and ready for processing.",
    document: documentName,
    pageCount: 0,
    clauses: [],
    obligations: [],
    reviewFlags: [],
  };
}

export async function listWorkspaceContractCards(
  workspaceId: number,
  search = "",
  status = "all"
) {
  const db = await getDb();
  const rows = await listWorkspaceContracts(workspaceId, search, status);
  if (!db) return [];
  const docs = await db
    .select()
    .from(documents)
    .where(eq(documents.workspaceId, workspaceId));
  const docsByContract = new Map(
    docs.map(document => [document.contractId, document.fileName])
  );
  return rows.map(row => toContractCard(row, docsByContract.get(row.id) ?? ""));
}
export async function getWorkspaceContractCard(
  workspaceId: number,
  contractId: number
) {
  const db = await getDb();
  const row = await getWorkspaceContract(workspaceId, contractId);
  if (!db || !row) return null;
  const docs = await db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.workspaceId, workspaceId),
        eq(documents.contractId, contractId)
      )
    )
    .limit(1);
  return toContractCard(row, docs[0]?.fileName ?? "");
}

export async function createWorkspaceUpload(input: {
  userId: number;
  workspaceId: number;
  ownerName?: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  let fileKey: string | undefined;
  if (input.fileData) {
    const bytes = Buffer.from(
      input.fileData.replace(/^data:[^;]+;base64,/, ""),
      "base64"
    );
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stored = await storagePut(
      `contracts/${input.workspaceId}/${Date.now()}-${safeName}`,
      bytes,
      input.mimeType
    );
    fileKey = stored.key;
  }
  const contractInsert = await db.insert(contracts).values({
    ownerId: input.userId,
    workspaceId: input.workspaceId,
    name: input.fileName.replace(/\.[^.]+$/, ""),
    contractType:
      input.mimeType === "application/pdf" ? "PDF contract" : "DOCX contract",
    status: "review",
    riskLevel: "medium",
    ownerName: input.ownerName ?? undefined,
  });
  const contractId = Number(contractInsert[0].insertId);
  const documentInsert = await db.insert(documents).values({
    contractId,
    workspaceId: input.workspaceId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileKey,
    fileSize: input.fileSize,
    processingStatus: "processing",
  });
  return {
    contractId,
    documentId: Number(documentInsert[0].insertId),
    fileName: input.fileName,
  };
}
