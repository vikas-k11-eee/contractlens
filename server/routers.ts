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
  getWorkspaceContractCard,
  getWorkspaceDashboard,
  getWorkspaceDashboardData,
  createWorkspaceUpload,
  getChatContext,
  getOrCreateChatSession,
  listChatMessages,
  saveChatMessage,
  listWorkspaceAlerts,
  listWorkspaceContractCards,
  listWorkspaceContracts,
  listWorkspaceObligations,
  updateUserProfile,
  updateUserSettings,
} from "./db";
import { workspaces } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import {
  getEmptyDashboard,
  getDashboard,
  getContract,
  getAllObligations,
  demoAlerts,
  demoContracts,
  type Alert,
  type CompareChange,
  type Contract,
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
  chat: router({
    history: protectedProcedure.query(async ({ ctx }) => {
      const account = await getAccountContext(ctx.user.id);
      if (!account?.workspace) return { sessionId: null, messages: [] };
      const session = await getOrCreateChatSession(
        ctx.user.id,
        account.workspace.id
      );
      return {
        sessionId: session.id,
        messages: await listChatMessages(session.id),
      };
    }),
    ask: protectedProcedure
      .input(
        z.object({
          question: z.string().trim().min(2).max(4000),
          contractIds: z.array(z.number().int().positive()).max(50).default([]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const account = await getAccountContext(ctx.user.id);
        if (!account?.workspace) throw new Error("Workspace is not available");
        const session = await getOrCreateChatSession(
          ctx.user.id,
          account.workspace.id
        );
        await saveChatMessage(session.id, "user", input.question);
        const context = await getChatContext(
          account.workspace.id,
          input.contractIds
        );
        const contextText = context.length
          ? context
              .map(
                ({ contract, document }) =>
                  `Contract: ${contract.name}\nType: ${contract.contractType}\nStatus: ${contract.status}\nOwner: ${contract.ownerName ?? "Not specified"}\nSource file: ${document?.fileName ?? "Not available"}\nNo extracted clause text is available yet.`
              )
              .join("\n\n")
          : "No contracts were found in this workspace.";
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are ContractLens AI. Answer only from the supplied workspace contract context. Never invent clauses, dates, payments, or legal facts. If the context does not contain the answer, say: I couldn't find this information in your uploaded contracts. Clearly state when document text extraction is still pending.",
            },
            {
              role: "user",
              content: `Workspace contract context:\n${contextText}\n\nQuestion: ${input.question}`,
            },
          ],
        });
        const content =
          typeof response.choices?.[0]?.message?.content === "string"
            ? response.choices[0].message.content
            : "I couldn't generate an answer from your uploaded contracts.";
        await saveChatMessage(session.id, "assistant", content);
        return {
          answer: content,
          sources: context.map(({ contract, document }) => ({
            contractId: contract.id,
            contractName: contract.name,
            documentName: document?.fileName ?? null,
            section: "Contract metadata",
            page: null,
          })),
        };
      }),
  }),
  dashboard: router({
    overview: protectedProcedure
      .input(
        z
          .object({ mode: z.enum(["personal", "demo"]).default("personal") })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        if (input?.mode === "demo") {
          await getAccountContext(ctx.user.id);
          return getDashboard();
        }
        const account = await getAccountContext(ctx.user.id);
        return account?.workspace
          ? getWorkspaceDashboardData(account.workspace.id)
          : getEmptyDashboard();
      }),
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
        await getAccountContext(ctx.user.id);
        void input;
        return [] as Contract[];
      }),
    ownedGet: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(() => null as Contract | null),
    list: protectedProcedure
      .input(
        z
          .object({
            search: z.string().optional(),
            status: z.string().optional(),
            mode: z.enum(["personal", "demo"]).default("personal"),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        if (input?.mode === "demo") {
          await getAccountContext(ctx.user.id);
          const search = input.search?.toLowerCase().trim() ?? "";
          const status = input.status ?? "all";
          return demoContracts.filter(
            contract =>
              (!search ||
                `${contract.name} ${contract.type} ${contract.owner}`
                  .toLowerCase()
                  .includes(search)) &&
              (status === "all" || contract.status === status)
          );
        }
        const account = await getAccountContext(ctx.user.id);
        return account?.workspace
          ? listWorkspaceContractCards(
              account.workspace.id,
              input?.search ?? "",
              input?.status ?? "all"
            )
          : [];
      }),
    get: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          mode: z.enum(["personal", "demo"]).default("personal"),
        })
      )
      .query(async ({ ctx, input }) => {
        if (input.mode === "demo") {
          await getAccountContext(ctx.user.id);
          return getContract(input.id);
        }
        const account = await getAccountContext(ctx.user.id);
        const id = Number(input.id);
        return account?.workspace && Number.isInteger(id)
          ? getWorkspaceContractCard(account.workspace.id, id)
          : null;
      }),
    obligations: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(() => []),
    clauses: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(() => []),
    timeline: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(() => []),
    summary: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(() => null),
    query: protectedProcedure
      .input(z.object({ id: z.string(), question: z.string().min(3) }))
      .mutation(() => ({
        answer:
          "Upload and process a contract to ask source-grounded questions.",
        source: { page: 0, section: "No source available", excerpt: "" },
        mode: "workspace-empty" as const,
      })),
    compare: protectedProcedure
      .input(z.object({ leftId: z.string(), rightId: z.string() }))
      .query(() => [] as CompareChange[]),
    upload: protectedProcedure
      .input(
        z.object({
          fileName: z.string().min(1),
          mimeType: z.enum([
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ]),
          fileSize: z.number().max(25_000_000),
          fileData: z.string().max(35_000_000).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const account = await getAccountContext(ctx.user.id);
        if (!account?.workspace) throw new Error("Workspace is not available");
        const result = await createWorkspaceUpload({
          userId: ctx.user.id,
          workspaceId: account.workspace.id,
          ownerName: ctx.user.name,
          ...input,
        });
        return {
          status: "processing" as const,
          mode: "workspace" as const,
          ...result,
          message: "Upload saved to your workspace and queued for processing.",
        };
      }),
  }),
  obligations: router({
    list: protectedProcedure
      .input(
        z
          .object({ mode: z.enum(["personal", "demo"]).default("personal") })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        if (input?.mode === "demo") {
          await getAccountContext(ctx.user.id);
          return getAllObligations().map(obligation => ({
            ...obligation,
            contractName: getContract(obligation.contractId).name,
          }));
        }
        const account = await getAccountContext(ctx.user.id);
        return account?.workspace ? [] : [];
      }),
    ownedList: protectedProcedure.query(async ({ ctx }) => {
      const account = await getAccountContext(ctx.user.id);
      return account?.workspace
        ? listWorkspaceObligations(account.workspace.id)
        : [];
    }),
  }),
  alerts: router({
    list: protectedProcedure
      .input(
        z
          .object({ mode: z.enum(["personal", "demo"]).default("personal") })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        if (input?.mode === "demo") {
          await getAccountContext(ctx.user.id);
          return demoAlerts;
        }
        await getAccountContext(ctx.user.id);
        return [] as Alert[];
      }),
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
