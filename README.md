# BriefFill

> Analyze client creative briefs for missing information — powered by AI, built for freelancers and agencies.

BriefFill evaluates incoming briefs against 12 critical fields, scores completeness, surfaces missing context, and drafts a professional clarification email you can send straight from Gmail. The **Brief Assistant** (`/briefs/generate`) also writes a complete structured brief from a 1-2 sentence intent — useful when you have a project in mind but no time to write the spec yourself.

Once you've analyzed a few briefs, BriefFill also tracks **performance over time**: a hand-built score-over-time chart, per-industry self-benchmarks, and a 5-star outcome panel on each brief so you can record whether the project actually succeeded.

For **competitive intelligence**, drop 1-3 competitor briefs (text or .txt/.docx/.pdf) into the "Compare with competitors" section on any brief. BriefFill scores each competitor against the same 12-field framework, surfaces the strengths and gaps common across all of them, and writes a tight 1-2 sentence differentiation opportunity for your own brief.

BriefFill also integrates with the rest of your stack. From the **Integrations** page, connect Notion, ClickUp, or Airtable (one-click export of any brief) and configure outbound webhooks that fire on 5 brief lifecycle events (analyzed, rebuilt, outcome recorded, competitor analysis run, email generated) — point them at Zapier, Make, n8n, or your own scripts. A standalone **Google Docs add-on** (`/google-docs-addon/`) lets you analyze briefs directly inside any Doc, authenticated with a per-user API key generated from the Integrations page.

**Pricing & billing**: BriefFill has 4 plans — Free (5 briefs/month), Pro ($19/mo, unlimited), Team ($49/mo, 5 seats), Agency ($99/mo, 15 seats + competitor analysis + API). Visit `/pricing` for the public marketing page or `/dashboard/billing` (in-app) to manage your subscription. Stripe Checkout + Customer Portal handle payments and self-service billing; an in-app dev bypass lets you change plans locally without Stripe credentials. The Free plan's 5-brief monthly cap is enforced server-side.

A **Chrome extension** (`/extension/`) adds a floating "Analyze with BriefFill" pill to any page (Gmail, Slack, Notion, anywhere). Highlight text → click the pill → side panel opens with the score, missing fields, and suggested questions. In Gmail, the client and project names auto-fill from the email's sender and subject.

## Tech Stack

- **Backend**: Node.js 18+ / Express / sql.js (SQLite in-memory, persisted to file)
- **Frontend**: React 18 / Vite / Tailwind CSS / React Router
- **Auth**: JWT + bcrypt
- **AI**: Local LLM bridge (OpenAI-compatible, default `http://localhost:11434/v1/chat/completions`)

---

## Quick Start (Local Development)

### Prerequisites

- Node.js >= 18
- npm
- (Optional) A local LLM bridge running on `localhost:11434` — without it, BriefFill falls back to a heuristic analysis

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Seed the database

```bash
cd .. && node database/seed.js
```

This creates `backend/database/brieffill.db` and populates the 12 field definitions.

### 3. Start the backend

```bash
cd backend && npm run dev
```

Server runs on `http://localhost:5000`. The database initializes on first launch.

### 4. Start the frontend

```bash
cd frontend && npm run dev
```

App runs on `http://localhost:5173` with `/api` proxied to the backend.

### 5. Create an account

Visit `http://localhost:5173/register` — you get 5 free brief analyses on the 7-day trial.

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
DB_PATH=./database/brieffill.db
GEMINI_API_URL=http://localhost:11434/v1/chat/completions
GROQ_API_KEY=                                # required for AI features
GROQ_MODEL=llama-3.3-70b-versatile
JWT_SECRET=replace-with-a-long-random-string
NODE_ENV=development
LOG_DIR=./logs

# Stripe billing (optional — without these, /api/billing/checkout returns 503
# and the dev /api/billing/bypass endpoint can be used to change plans locally)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_TEAM_MONTHLY=price_...
STRIPE_PRICE_TEAM_ANNUAL=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_ANNUAL=price_...
STRIPE_PORTAL_RETURN_URL=http://localhost:5173/dashboard/billing
FRONTEND_BASE_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

Only needed for production / when the API is on a different origin.

### Notion Integration (Optional)

The Brief Builder's "Save to Notion" export lets users push an improved brief into a Notion database. Setup takes about 5 minutes:

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) and click **New integration**.
2. Give it a name (e.g., "BriefFill") and select the workspace where your briefs database lives.
3. Under **Capabilities**, enable **Insert content** and **Read content** (the defaults usually include these).
4. Click **Submit** and copy the **Internal Integration Secret** — this is your `NOTION_API_KEY`.
5. In Notion, create a new database with a **Name** (title) property. This will hold your briefs.
6. Open the database, click **•••** (top right) → **Connections** → add the integration you just created.
7. Copy the database ID from the URL — it's the 32-character hash between the workspace name and the `?v=` query param: `notion.so/{workspace}/{DATABASE_ID}?v=...`
8. Add both values to `backend/.env`:
   ```env
   NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxx
   NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
9. Restart the backend. The "Save to Notion" button in the Export menu will activate.

The integration supports the official Notion API only. Self-hosted Notion instances are not supported.

---

## Project Structure

```
brieffill/
├── backend/
│   ├── src/
│   │   ├── routes/          # Express routers
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # AI + email services
│   │   ├── middleware/      # Auth + error handler
│   │   └── utils/           # DB, logger, validation
│   ├── package.json
│   ├── server.js
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI (Header, Skeleton, EmailDraft, ...)
│   │   ├── pages/           # Route components
│   │   ├── contexts/        # AuthContext
│   │   └── utils/           # Axios instance
│   ├── package.json
│   └── index.html
├── database/
│   ├── schema.sql
│   ├── seed.js              # Seeds the 12 field definitions
│   └── brieffill.db         # (generated)
├── google-docs-addon/       # Apps Script project (analyze briefs inside Google Docs)
├── extension/               # Chrome extension (MV3 side panel + content script)
│   ├── manifest.json
│   ├── background.js        # Service worker
│   ├── content.js           # Selection capture + Gmail auto-fill
│   ├── content.css
│   ├── sidepanel.html/.js   # The main analyze UI
│   ├── popup.html/.js       # Toolbar icon popup
│   ├── options.html/.js     # Settings: API key + sign-in + key management
│   ├── shared.js            # API client + helpers
│   ├── styles.css
│   └── icons/               # 16/48/128 PNGs
├── Dockerfile
├── deploy.sh
├── railway.json
├── render.yaml
├── frontend/vercel.json
└── README.md
```

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check |
| `GET` | `/api/fields` | — | List 12 field definitions |
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Sign in |
| `GET` | `/api/auth/me` | ✓ | Current user |
| `POST` | `/api/briefs/analyze` | ✓ | Analyze a new brief |
| `POST` | `/api/briefs/generate` | ✓ | Generate a structured brief from a 1-2 sentence prompt (12 fields, ~400-1500 words) |
| `POST` | `/api/briefs/regenerate` | ✓ | Refine a generated brief with freeform feedback |
| `GET` | `/api/briefs` | ✓ | List briefs (paginated) |
| `GET` | `/api/briefs/:id` | ✓ | Get a single brief |
| `POST` | `/api/briefs/:id/email` | ✓ | Generate clarification email |
| `GET` | `/api/subscriptions/plans` | — | List plans (legacy endpoint) |
| `GET` | `/api/subscriptions/my` | ✓ | My subscription (legacy endpoint) |
| `POST` | `/api/subscriptions/bypass` | ✓ | Dev-mode plan switcher (legacy) |
| `POST` | `/api/subscriptions/cancel` | ✓ | Cancel subscription (legacy) |
| `GET` | `/api/billing/plans` | — | List 4-tier plans (Free / Pro / Team / Agency) with annual + monthly prices |
| `GET` | `/api/billing/me` | ✓ | Current billing state + recent invoices |
| `POST` | `/api/billing/checkout` | ✓ | Create Stripe Checkout session for a plan upgrade |
| `POST` | `/api/billing/checkout/verify` | ✓ | Verify a completed Checkout session (called by the frontend on return) |
| `POST` | `/api/billing/portal` | ✓ | Create a Stripe Customer Portal session for self-service billing |
| `POST` | `/api/billing/cancel` | ✓ | Cancel current subscription (keeps access until period end) |
| `POST` | `/api/billing/bypass` | ✓ | Dev-only plan switcher (no Stripe) |
| `GET` | `/api/billing/invoices` | ✓ | List the user's invoices |
| `POST` | `/api/billing/webhook` | signature | Stripe webhook receiver (signature-verified) |
| `GET` | `/api/usage/usage` | ✓ | Usage statistics |
| `POST` | `/api/briefs/:id/outcome` | ✓ | Record/update the outcome (rating + status) of a brief |
| `GET` | `/api/briefs/:id/outcome` | ✓ | Get the outcome for a brief |
| `GET` | `/api/analytics/score-timeline` | ✓ | Last N briefs' scores (ascending) |
| `GET` | `/api/analytics/benchmarks` | ✓ | Per-industry score benchmarks (self) |
| `GET` | `/api/analytics/outcome-summary` | ✓ | Success rate + avg rating across recorded outcomes |
| `POST` | `/api/briefs/:id/competitor-analysis` | ✓ | Run competitive intelligence on 1-3 competitor briefs |
| `GET` | `/api/briefs/:id/competitor-analysis` | ✓ | Get the saved competitor analysis (or `null`) |
| `GET` | `/api/integrations/status` | ✓ | Per-provider config + recent webhook deliveries |
| `PUT` | `/api/integrations/:provider` | ✓ | Save per-user Notion/ClickUp/Airtable/webhook config |
| `DELETE` | `/api/integrations/:provider` | ✓ | Clear per-user config for a provider |
| `POST` | `/api/integrations/:provider/test` | ✓ | Test the connection (sends a test webhook for `provider=webhook`) |
| `POST` | `/api/briefs/:id/export/clickup` | ✓ | Send a brief to the user's configured ClickUp list |
| `POST` | `/api/briefs/:id/export/airtable` | ✓ | Add a row to the user's configured Airtable base/table |
| `POST` | `/api/briefs/:id/export/notion-user` | ✓ | Save a brief to the user's personal Notion database (vs. server-wide) |
| `POST` | `/api/api-keys` | ✓ | Generate a personal API key (for the Google Docs add-on) |
| `GET` | `/api/api-keys` | ✓ | List your active API keys |
| `DELETE` | `/api/api-keys/:id` | ✓ | Revoke an API key |
| `POST` | `/api/public/analyze` | API key | Stateless analysis for the Google Docs add-on (auth via `X-BriefFill-Api-Key` header) |

---

## Deployment

### Option 1: One-click via `deploy.sh`

```bash
./deploy.sh
```

Installs deps, builds the frontend, seeds the DB, and (if the CLIs are available) deploys to Vercel + Railway.

### Option 2: Docker

```bash
docker build -t brieffill .
docker run -p 5000:5000 -v $(pwd)/data:/app/backend/database brieffill
```

### Option 3: Vercel (frontend) + Railway (backend)

**Backend → Railway**
1. Push to GitHub
2. New Project on Railway → "Deploy from GitHub" → select repo
3. Set root directory to `backend/`
4. Add env vars (`JWT_SECRET`, `GEMINI_API_URL`, `NODE_ENV=production`)
5. Railway will detect `railway.json` and deploy

**Frontend → Vercel**
1. New Project on Vercel → import repo
2. Set root directory to `frontend/`
3. Add env var `VITE_API_URL=https://<your-railway-app>.up.railway.app/api`
4. Vercel detects `vercel.json` and deploys

### Option 4: Render

`render.yaml` is configured for one-click Blueprint deploys. Connect your repo at render.com → New → Blueprint.

### Required production env vars

```
NODE_ENV=production
JWT_SECRET=<generate-with: openssl rand -hex 64>
GEMINI_API_URL=<your-ai-bridge-url>
PORT=5000  # Railway/Render set this automatically
```

---

## Development Notes

- **Auth**: JWT expires in 7 days. Test with `Authorization: Bearer <token>` header.
- **Database**: Uses `sql.js` (in-memory SQLite, persisted to `brieffill.db`). To reset: delete the file and restart.
- **AI fallback**: If the LLM bridge is unreachable, the service returns a word-count-based heuristic analysis with all 12 fields marked "partial" or "missing".
- **Subscription**: The `/bypass` endpoint simulates Stripe checkout in dev. Replace with real Stripe Checkout for production.
- **Logs**: Errors are written to `backend/logs/error.log` (JSON format) and stdout.

### Chrome extension (`/extension/`)

The Chrome extension is a no-build MV3 bundle — pure HTML/JS/CSS, no Tailwind, no bundler. To install for local development:

1. Open `chrome://extensions/` in Chrome 114+.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension/` directory.
4. Click the toolbar icon → opens the side panel → click **Settings** → paste a `bfk_…` API key (generate one in BriefFill → Integrations → Google Docs add-on).
5. Open any Gmail tab (or any other page) → highlight ≥ 20 characters of text → click the floating **Analyze with BriefFill** pill → results appear in the side panel.

The extension's auth model:
- **API key** (always required): the `bfk_…` token authenticates `POST /api/public/analyze` via the `X-BriefFill-Api-Key` header.
- **Email/password sign-in** (optional): signs you in via `POST /api/auth/login`, stores the JWT, and enables the **Save to BriefFill** button in the side panel. Without it, the extension is read-only (analyze + copy).

There is no backend code specific to the extension — it uses the same `/api/public/analyze`, `/api/auth/login`, and `/api/briefs/analyze` endpoints that the web app and Google Docs add-on use.

---

## License

MIT
