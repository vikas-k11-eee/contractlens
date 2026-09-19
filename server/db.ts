import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  contracts,
  alerts,
  obligations,
  userSettings,
  users,
  workspaces,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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
