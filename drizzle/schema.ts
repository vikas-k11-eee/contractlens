import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  profileImage: varchar("profileImage", { length: 512 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  deadlineAlerts: boolean("deadlineAlerts").default(true).notNull(),
  renewalAlerts: boolean("renewalAlerts").default(true).notNull(),
  overdueAlerts: boolean("overdueAlerts").default(true).notNull(),
  weeklySummary: boolean("weeklySummary").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  contractType: varchar("contractType", { length: 120 }).notNull(),
  status: mysqlEnum("status", ["active", "review", "expiring", "archived"])
    .default("active")
    .notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"])
    .default("low")
    .notNull(),
  effectiveDate: timestamp("effectiveDate"),
  expirationDate: timestamp("expirationDate"),
  renewalDate: timestamp("renewalDate"),
  ownerName: varchar("ownerName", { length: 160 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contractParties = mysqlTable("contractParties", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  partyType: varchar("partyType", { length: 80 }),
  role: varchar("role", { length: 120 }),
  address: text("address"),
});

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }),
  fileSize: int("fileSize"),
  pageCount: int("pageCount"),
  extractedText: text("extractedText"),
  processingStatus: mysqlEnum("processingStatus", [
    "uploading",
    "processing",
    "analyzing",
    "completed",
    "failed",
  ])
    .default("processing")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const contractVersions = mysqlTable("contractVersions", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  documentId: int("documentId").notNull(),
  versionLabel: varchar("versionLabel", { length: 80 }).notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export const clauses = mysqlTable("clauses", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  documentId: int("documentId").notNull(),
  clauseNumber: varchar("clauseNumber", { length: 32 }),
  title: varchar("title", { length: 255 }).notNull(),
  text: text("text").notNull(),
  category: varchar("category", { length: 100 }),
  pageNumber: int("pageNumber"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
});

export const obligations = mysqlTable("obligations", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  clauseId: int("clauseId"),
  obligation: text("obligation").notNull(),
  responsibleParty: varchar("responsibleParty", { length: 255 }).notNull(),
  beneficiary: varchar("beneficiary", { length: 255 }),
  dueDate: timestamp("dueDate"),
  frequency: varchar("frequency", { length: 80 }),
  priority: mysqlEnum("priority", ["low", "medium", "high"])
    .default("medium")
    .notNull(),
  status: mysqlEnum("status", [
    "upcoming",
    "due_soon",
    "due",
    "completed",
    "overdue",
  ])
    .default("upcoming")
    .notNull(),
  sourceClause: varchar("sourceClause", { length: 120 }),
  sourcePage: int("sourcePage"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
});

export const deadlines = mysqlTable("deadlines", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  obligationId: int("obligationId"),
  label: varchar("label", { length: 255 }).notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: mysqlEnum("status", [
    "upcoming",
    "due_soon",
    "due",
    "completed",
    "overdue",
  ])
    .default("upcoming")
    .notNull(),
});

export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  obligationId: int("obligationId"),
  alertType: varchar("alertType", { length: 120 }).notNull(),
  message: text("message").notNull(),
  deadline: timestamp("deadline"),
  priority: mysqlEnum("priority", ["low", "medium", "high"])
    .default("medium")
    .notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "resolved"])
    .default("open")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const contractInsights = mysqlTable("contractInsights", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  kind: varchar("kind", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  detail: text("detail").notNull(),
  severity: mysqlEnum("severity", ["info", "review", "critical"])
    .default("info")
    .notNull(),
  documentId: int("documentId"),
  pageNumber: int("pageNumber"),
  section: varchar("section", { length: 120 }),
});

export const chatSessions = mysqlTable("chatSessions", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  userId: int("userId").notNull(),
  workspaceId: int("workspaceId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const sourceReferences = mysqlTable("sourceReferences", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  documentId: int("documentId").notNull(),
  pageNumber: int("pageNumber"),
  section: varchar("section", { length: 120 }),
  clauseNumber: varchar("clauseNumber", { length: 32 }),
  excerpt: text("excerpt").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Contract = typeof contracts.$inferSelect;
export type Obligation = typeof obligations.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
