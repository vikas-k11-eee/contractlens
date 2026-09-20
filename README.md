# ContractLens

ContractLens is an AI-powered contract intelligence workspace for uploading agreements, extracting contract text, tracking obligations, reviewing renewal risk, and asking source-grounded questions about contract content.

## Live website

**[Open ContractLens](https://contractai-ruueq2db.manus.space)**

The live application includes a read-only Demo workspace for exploring the dashboard and AI Contract Chat. Sign in with Manus to access a private workspace, upload contracts, view extracted details, and use workspace-scoped AI analysis.

## Features

- Read-only Demo workspace available before sign-in
- Manus OAuth authentication and authenticated user profiles
- Workspace-scoped contract library
- Upload support for PDF, DOCX, and TXT files
- Server-side document text extraction
- Contract detail views with processing status and source metadata
- Obligation, timeline, alert, comparison, and analytics views
- AI Contract Chat with Demo workspace support
- Private, workspace-scoped chat history for authenticated users
- Source citations and grounded responses based on extracted contract text
- Responsive dark workspace interface for desktop and mobile

## Technology

- React 19 and TypeScript
- Vite
- Tailwind CSS
- Express
- tRPC
- Drizzle ORM
- MySQL/TiDB
- Manus OAuth
- Manus built-in LLM services
- S3-compatible file storage
- Vitest

## Local development

### Prerequisites

- Node.js 22 or later
- pnpm
- MySQL/TiDB database
- Manus OAuth and built-in service environment variables

### Install dependencies

```bash
pnpm install
```

### Configure environment

Use the project runtime or deployment environment to provide the required variables, including `DATABASE_URL`, `JWT_SECRET`, Manus OAuth settings, and Manus built-in API settings. Do not commit `.env` files or secrets to the repository.

### Run the development server

```bash
pnpm dev
```

### Validate the project

```bash
pnpm check
pnpm test
pnpm build
```

## Project structure

```text
client/       React application and workspace UI
drizzle/      Database schema and migrations
server/       tRPC procedures, authentication, storage, and AI services
shared/       Shared constants and types
```

## Security and data isolation

Demo data is intentionally isolated from private user workspaces. Personal contract records, uploaded documents, extracted text, and authenticated chat history are accessed through workspace-scoped server procedures. Unauthenticated users can only access the read-only Demo workspace.

## Repository

[GitHub: vikas-k11-eee/contractlens](https://github.com/vikas-k11-eee/contractlens)

## License

This project is currently maintained as a private application repository. Add the project’s license terms here before distributing it publicly.
