import { eq } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAccountContext,
  getDb,
  getOrCreateWorkspace,
  getOrCreateUserSettings,
  getWorkspaceContract,
  getWorkspaceDashboard,
  listWorkspaceAlerts,
  listWorkspaceContracts,
  listWorkspaceObligations,
  updateUserProfile,
  updateUserSettings,
} from "./db";
import { workspaces } from "../drizzle/schema";
import {
  answerQuestion,
  compareContracts,
  demoAlerts,
  demoContracts,
  getAllObligations,
  getContract,
  getDashboard,
} from "./contractData";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    account: protectedProcedure.query(({ ctx }) =>
      getAccountContext(ctx.user.id)
    ),
    updateProfile: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(120) }))
      .mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    current: protectedProcedure.query(({ ctx }) =>
      getOrCreateWorkspace({ id: ctx.user.id, name: ctx.user.name })
    ),
    rename: protectedProcedure
      .input(z.object({ name: z.string().trim().min(2).max(160) }))
      .mutation(async ({ ctx, input }) => {
        const account = await getAccountContext(ctx.user.id);
        if (!account?.workspace) return null;
        const db = await getDb();
        if (!db) return null;
        await db
          .update(workspaces)
          .set({ name: input.name })
          .where(eq(workspaces.id, account.workspace.id));
        return getOrCreateWorkspace({ id: ctx.user.id, name: ctx.user.name });
      }),
  }),
  settings: router({
    get: protectedProcedure.query(({ ctx }) =>
      getOrCreateUserSettings(ctx.user.id)
    ),
    update: protectedProcedure
      .input(
        z.object({
          emailNotifications: z.boolean().optional(),
          deadlineAlerts: z.boolean().optional(),
          renewalAlerts: z.boolean().optional(),
          overdueAlerts: z.boolean().optional(),
          weeklySummary: z.boolean().optional(),
        })
      )
      .mutation(({ ctx, input }) => updateUserSettings(ctx.user.id, input)),
  }),
  dashboard: router({
    overview: publicProcedure.query(() => getDashboard()),
    owned: protectedProcedure.query(async ({ ctx }) => {
      const account = await getAccountContext(ctx.user.id);
      return account?.workspace
        ? getWorkspaceDashboard(account.workspace.id)
        : null;
    }),
  }),
  contracts: router({
    ownedList: protectedProcedure
      .input(
        z
          .object({
            search: z.string().optional(),
            status: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const account = await getAccountContext(ctx.user.id);
        return account?.workspace
          ? listWorkspaceContracts(
              account.workspace.id,
              input?.search ?? "",
              input?.status ?? "all"
            )
          : [];
      }),
    ownedGet: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const account = await getAccountContext(ctx.user.id);
        return account?.workspace
          ? getWorkspaceContract(account.workspace.id, input.id)
          : undefined;
      }),
    list: publicProcedure
      .input(
        z
          .object({
            search: z.string().optional(),
            status: z.string().optional(),
          })
          .optional()
      )
      .query(({ input }) => {
        const search = input?.search?.toLowerCase().trim() ?? "";
        const status = input?.status ?? "all";
        return demoContracts.filter(contract => {
          const matchesSearch =
            !search ||
            [
              contract.name,
              contract.type,
              contract.owner,
              ...contract.parties.map(party => party.name),
            ]
              .join(" ")
              .toLowerCase()
              .includes(search);
          const matchesStatus = status === "all" || contract.status === status;
          return matchesSearch && matchesStatus;
        });
      }),
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => getContract(input.id)),
    obligations: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => getContract(input.id).obligations),
    clauses: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => getContract(input.id).clauses),
    timeline: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        const contract = getContract(input.id);
        return [
          {
            id: "start",
            label: "Contract start",
            date: contract.effectiveDate,
            status: "completed",
            type: "milestone",
          },
          ...contract.obligations.map(obligation => ({
            id: obligation.id,
            label: obligation.obligation,
            date: obligation.dueDate,
            status: obligation.status,
            type: "obligation",
          })),
          {
            id: "renewal",
            label: "Renewal / expiration",
            date: contract.expirationDate,
            status: contract.status === "expiring" ? "due_soon" : "upcoming",
            type: "milestone",
          },
        ];
      }),
    summary: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        const contract = getContract(input.id);
        return {
          ...contract,
          generatedBy: "ContractLens demo extraction layer",
          disclaimer:
            "AI-assisted summary. Verify against the source document before acting.",
        };
      }),
    query: publicProcedure
      .input(z.object({ id: z.string(), question: z.string().min(3) }))
      .mutation(({ input }) => ({
        ...answerQuestion(input.id, input.question),
        mode: "demo-evidence" as const,
      })),
    compare: publicProcedure
      .input(z.object({ leftId: z.string(), rightId: z.string() }))
      .query(({ input }) => compareContracts(input.leftId, input.rightId)),
    upload: publicProcedure
      .input(
        z.object({
          fileName: z.string().min(1),
          mimeType: z.enum([
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ]),
          fileSize: z.number().max(25_000_000),
        })
      )
      .mutation(({ input }) => ({
        status: "processing" as const,
        mode: "demo" as const,
        fileName: input.fileName,
        message:
          "Upload received. Connect the document processing integration to extract live clauses and evidence.",
      })),
  }),
  obligations: router({
    list: publicProcedure.query(() =>
      getAllObligations().map(obligation => ({
        ...obligation,
        contractName: getContract(obligation.contractId).name,
      }))
    ),
    ownedList: protectedProcedure.query(async ({ ctx }) => {
      const account = await getAccountContext(ctx.user.id);
      return account?.workspace
        ? listWorkspaceObligations(account.workspace.id)
        : [];
    }),
  }),
  alerts: router({
    list: publicProcedure.query(() => demoAlerts),
    ownedList: protectedProcedure.query(async ({ ctx }) => {
      const account = await getAccountContext(ctx.user.id);
      return account?.workspace
        ? listWorkspaceAlerts(account.workspace.id)
        : [];
    }),
    acknowledge: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => ({
        id: input.id,
        status: "acknowledged" as const,
      })),
  }),
});

export type AppRouter = typeof appRouter;
