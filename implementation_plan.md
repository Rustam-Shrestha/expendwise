# YBC Financial Risk & Decision Support System — Revised Implementation Plan

## 1. Objective

Rebuild the existing MERN expense tracker into a maintainable financial risk and decision-support system with:

- Express/MongoDB backend organized by routes, controllers, services, and models.
- FastAPI ML service for K-Means, regression, and financial-risk prediction.
- React/Vite frontend using TanStack Query for server state and Zustand for session/UI state.
- Shared visual components and design tokens.
- Deterministic fabricated historical data covering every application collection and supporting ML training.

The application must remain runnable after every phase. No phase starts until the previous phase passes its gate.

## 2. Confirmed decisions

- Full rebuild: proceed with the complete architecture rather than limiting work to a backend fix.
- Seed format: deterministic code plus checked-in CSV fixtures.
- Dataset: 1 admin + 200 demo users, 12 months of history, approximately 8,000 transactions, and related records.
- Seed safety: explicit reset mode. `npm run seed -- --force` clears only known application/demo collections and recreates them; without `--force`, the command refuses to destroy existing data.
- All data is fabricated. No production customer data is used.
- Existing authentication and transaction behavior remain available through the new API, with the existing frontend replaced incrementally rather than discarded without a migration.

## 3. Current-state findings

The repository is a small, incomplete prototype:

- Root `package.json` only starts the old backend.
- Backend is a single Express entry point at `backend/index.js`, with legacy `model/`, `routes/`, `controllers/`, `middleware/`, and `db/` folders.
- Current `Transaction` model uses `timeStamp` instead of `timestamps`, has a required string category, and lacks indexes.
- Empty transaction results currently return HTTP 400; this must become HTTP 200 with an empty list.
- The old server uses `process.env.port` and connects to MongoDB after `listen`.
- Frontend uses React 18/Vite, React Router, context-based auth, Ant Design, Chart.js, and many duplicate/legacy components.
- ML is currently a Flask-style `ml/app.py` plus a standalone regression script and pickle artifact.
- No seed service, seed script, database test suite, or comprehensive design document exists yet.
- The supplied plan assumes React 18, MongoDB, and a FastAPI rebuild, but the current dependency manifests do not yet contain the proposed libraries.

## 4. Target architecture

```text
frontend React + Vite + Tailwind + TanStack Query + Zustand
        |
        v
Node/Express API: routes -> controllers -> services -> Mongoose models
        |
        +-----------------> MongoDB
        |
        +-----------------> FastAPI ML service
                               |
                               +-- synthetic risk dataset
                               +-- scikit-learn model artifacts
```

### Backend structure

```text
backend/
  src/
    config/{env,db,logger}.js
    models/{User,Transaction,Category,Budget,Goal,RiskSnapshot,Alert,AuditLog,index}.js
    services/{auth,transaction,budget,goal,risk,analytics,seed}.service.js
    controllers/{auth,transaction,category,budget,goal,risk,analytics,alert,admin}.controller.js
    routes/{index,auth,transaction,category,budget,goal,risk,analytics,alert,admin}.routes.js
    middleware/{auth,error,validate,rateLimit,notFound}.js
    utils/{ApiError,ApiResponse,asyncHandler,pagination}.js
    validators/{auth,transaction,budget,goal,category}.schema.js
    app.js
    server.js
  scripts/seed.js
  tests/
```

### ML structure

```text
ml/
  app/
    main.py
    config.py
    db.py
    routers/{kmeans,regression,risk}.py
    schemas/risk.py
    services/{feature_builder,risk_model}.py
  training/
    generate_synthetic.py
    train_risk.py
    train_regression.py
  data/risk_dataset.csv
  requirements.txt
```

### Frontend structure

Use feature-oriented folders:

```text
frontend/src/
  app/{router,AppShell,ProtectedRoute,Topbar,Sidebar,Container,PageHeader}
  shared/{components,icons,lib,utils}
  store/{authStore,uiStore,alertStore}
  features/{auth,transactions,budgets,goals,risk,analytics,alerts,settings,admin}
  pages/
```

## 5. Data model

### User

`email`, `userName`, `password` (hashed), `fullName`, `avatarUrl`, `role`, `monthlyIncome`, `currency`, `riskProfile`, `onboardingComplete`, `lastRiskScore`, `lastRiskLevel`, `lastRiskComputedAt`, and timestamps.

### Transaction

`userId`, `type`, positive `amount`, `currency`, `categoryId`, denormalized `categoryName`, `name`, `date`, `note`, `tags`, `paymentMethod`, `isRecurring`, `recurrenceRule`, and `source`.

Required indexes:

- `{ userId: 1, date: -1 }`
- `{ userId: 1, categoryId: 1 }`
- `{ userId: 1, type: 1, date: -1 }`

### Category

`userId` nullable, `name`, `slug`, `icon`, `color`, `kind`, `isSystem`, `budgetDefault`, timestamps. Add a unique index that permits one global slug and one user-specific slug.

### Budget

`userId`, `categoryId`, `period`, `amount`, `spent`, `periodStart`, `periodEnd`, `alertThresholdPct`, `status`, timestamps. Index `{ userId: 1, periodStart: -1 }`.

### Goal

`userId`, `title`, `targetAmount`, `savedAmount`, `deadline`, `category`, `status`, `contributions[]`, timestamps.

### RiskSnapshot

`userId`, `computedAt`, `score`, `level`, the nine model features, `reasons[]`, `recommendations[]`, and `modelVersion`. Index `{ userId: 1, computedAt: -1 }`.

### Alert

`userId`, `type`, `severity`, `title`, `message`, `payload`, `read`, `dismissedAt`, timestamps. Index `{ userId: 1, read: 1, createdAt: -1 }`.

### AuditLog

`userId`, `action`, `resource`, `resourceId`, `ip`, `userAgent`, `meta`, and timestamp.

## 6. API contract

Use one response envelope:

```json
{ "success": true, "data": {}, "meta": { "page": 1, "limit": 20, "total": 100 } }
```

Errors use:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

Endpoints:

- `GET /healthz`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- CRUD and summary endpoints for categories, transactions, budgets, and goals
- `POST /api/v1/goals/:id/contribute`
- `GET /api/v1/risk/latest`
- `GET /api/v1/risk/history?limit=12`
- `POST /api/v1/risk/recompute`
- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/analytics/health-score`
- Alerts read/dismiss endpoints
- Admin user and audit-log endpoints, role-protected

All list endpoints support validated pagination, date range, category, and type filters. Empty lists are successful responses.

## 7. ML design

- Generate 5,000 deterministic synthetic risk rows with the nine features: income, expense, savings ratio, expense growth, food percentage, transport percentage, entertainment percentage, transaction count, and transaction variance.
- Use the documented rule-based risk label with bounded noise.
- Train a versioned RandomForest classifier and scaler; report accuracy, precision, recall, F1, and confusion matrix.
- Preserve the existing regression capability as a separate linear-regression training pipeline.
- Implement `POST /api/risk/predict` and `POST /api/risk/batch` with input validation and explicit model-version responses.
- Build features from the most recent 90 days of transactions. Return score, level, reasons, recommendations, and feature values.
- Make model loading lazy and return a clear service error if artifacts have not been trained.
- Do not expose ML service credentials or allow the browser to call MongoDB directly.

## 8. Frontend behavior

Routes:

- `/login`, `/register`
- `/`, `/transactions`, `/budgets`, `/goals`
- `/risk`, `/analytics`, `/alerts`, `/settings`
- `/admin`, `/403`, and not-found route

All API data is owned by TanStack Query. Zustand stores only authentication, UI, and notification state. Use React Hook Form plus Zod for forms. Replace Ant Design/legacy chart usage with shared components and Recharts only after the replacement API is working.

Every page must provide loading, empty, error, and success states. Every mutation must invalidate the affected queries and show a toast. Protect all private routes and implement a mobile navigation drawer below 1024px.

## 9. Complete seed strategy

### Seed entry point

Add:

```text
backend/scripts/seed.js
backend/src/services/seed.service.js
backend/package.json script: "seed": "node scripts/seed.js"
```

Recommended usage:

```bash
npm run seed -- --force
```

`--force` is mandatory before deleting known collections. The command must:

1. Load and validate environment variables.
2. Connect to the configured MongoDB database.
3. Verify the target database name and refuse to reset an unexpected production-like database.
4. Delete only `users`, `transactions`, `categories`, `budgets`, `goals`, `risksnapshots`, `alerts`, and `auditlogs`.
5. Recreate indexes.
6. Import CSV fixtures in dependency order.
7. Resolve all foreign keys from deterministic IDs.
8. Create derived budget spend values and goal saved amounts from transaction/contribution data.
9. Create risk snapshots either through the ML service or a documented deterministic fallback if ML is unavailable.
10. Validate counts, referential integrity, indexes, date range, and risk distribution.
11. Disconnect cleanly and print the generated demo credentials and summary.

### CSV fixture files

Create:

```text
backend/src/seed/fixtures/
  users.csv
  categories.csv
  transactions.csv
  budgets.csv
  goals.csv
  risk_snapshots.csv
  alerts.csv
  audit_logs.csv
```

Also create `ml/data/risk_dataset.csv` for model training. These files must contain only fabricated records and stable IDs.

### Deterministic user and category population

- Seed 201 users: `admin@demo.ybc.local`, `user001@demo.ybc.local` through `user200@demo.ybc.local`.
- Use a known demo password generated/stored for development only, with no real credentials.
- Generate 8 system expense categories and 4 system income categories: salary, freelance, gift, investment, food, housing, transport, utilities, healthcare, education, shopping, entertainment, and other.
- Assign each user a deterministic risk profile and monthly income range.
- Do not generate duplicate email, username, slug, or transaction references.

### Historical transactions

- Generate 12 complete calendar months ending at the seed execution date, or use a fixed cutoff if reproducibility is preferred.
- Target approximately 40 transactions per user: roughly 96,000 total records at full scale. If the product acceptance target of approximately 8,000 is retained, use approximately 4 transactions per user/month and explicitly record the chosen volume. The plan should prefer a configurable `SEED_TRANSACTION_COUNT`, defaulting to 40 per user, because 201 users × 12 months × 40 is not approximately 8,000.
- Include one or more monthly salary/income records, recurring rent, utilities, food, transport, healthcare, education, shopping, entertainment, and occasional irregular expenses.
- Use realistic ratios by user profile, payment methods, dates, notes, tags, and 5% spikes.
- Add controlled anomalies: unusual spending, budget breaches, risk escalation, and a few achieved/active/abandoned goals.
- Use `source=seed` and explicit `categoryId` references.

### Budgets, goals, risk, and alerts

- Create 4 budgets per user for food, transport, shopping, and entertainment.
- Create 2 goals per user: one active and one achieved or abandoned based on deterministic profile.
- Create 12 risk snapshots per user or one snapshot per historical month, with score/level/features/reasons/recommendations.
- Create alerts for threshold breaches, unusual spending, risk escalation, and goal milestones.
- Create audit records for seeding, login demo activity, and representative mutations.

### Seed validation and tests

Add tests that verify:

- exactly 201 users;
- 12 months represented;
- all transaction references resolve;
- transaction amounts are positive and totals are plausible;
- no duplicate transaction keys;
- budgets, goals, alerts, and risk snapshots are created;
- rerunning with `--force` produces identical logical data;
- rerunning without `--force` does not delete data;
- CSV parser rejects malformed rows and invalid foreign keys.

## 10. Implementation phases and gates

### Phase 0 — Baseline and dependency audit

- Record current commands, environment, route behavior, and frontend build output.
- Update ignore rules for generated artifacts, local environments, virtual environments, logs, model files, and seed output.
- Add missing scripts without changing behavior.
- Gate: existing backend and frontend still run.

### Phase 1 — Backend foundation and bug fixes

- Introduce config validation, logger, response helpers, async error handling, authentication middleware, validation, rate limiting, and global errors.
- Fix environment parsing, database startup ordering, bearer-token support, password logging, timestamps, CORS, and empty-list semantics.
- Add focused auth and transaction tests.
- Gate: health endpoint and all current API behavior pass.

### Phase 2 — Models, services, and API expansion

- Implement all eight domain models with indexes and ownership checks.
- Implement services for transactions, budgets, goals, risk, analytics, and alerts.
- Add versioned routes/controllers and validation schemas.
- Gate: API contract tests pass with pagination, filtering, summaries, and authorization.

### Phase 3 — ML service

- Create FastAPI application, training scripts, synthetic dataset, model artifacts, health endpoint, prediction endpoints, and feature builder.
- Gate: train from clean checkout, predict a known vector, and pass smoke tests.

### Phase 4 — Seeder and fixtures

- Implement reset protection, CSV fixtures, dependency-order imports, derived totals, risk generation/fallback, and validation.
- Gate: force reset creates 201 users, 12 months, all collections populated, and no dangling references.

### Phase 5 — Design system

- Establish tokens, typography, spacing, controls, cards, tables, badges, alerts, skeletons, gauges, and icon primitives.
- Gate: shared component smoke tests and visual review against the existing UI documentation.

### Phase 6 — Frontend state and API layer

- Add Axios wrapper, auth/session persistence, query client, stores, domain query hooks, and error handling.
- Gate: no page directly calls `fetch`; all server data uses query hooks.

### Phase 7 — Page migration

- Migrate authentication, dashboard, transactions, budgets, goals, analytics, settings, risk, alerts, and admin pages incrementally.
- Gate: each route has loading/empty/error states and remains navigable while migration proceeds.

### Phase 8 — Integration

- Wire transaction mutations to budget checks and risk recomputation.
- Wire risk snapshots, alerts, query invalidation, and dashboard charts.
- Gate: a new expense updates totals, alerts, and risk behavior end-to-end.

### Phase 9 — Quality and cleanup

- Remove duplicate/legacy files only after replacement routes are active.
- Add accessibility, responsive, error-boundary, security, and performance checks.
- Update README, architecture, API, ML, and design-system documentation.
- Gate: backend tests, frontend lint/build, ML smoke tests, and seed validation all pass.

## 11. Required commands

Backend:

```bash
cd backend
npm test
npm run lint
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

ML:

```bash
cd ml
python -m app.training.generate_synthetic
python -m app.training.train_risk
python -m app.training.train_regression
uvicorn app.main:app --reload --port 5001
```

Full setup:

```bash
npm run seed -- --force
```

Do not claim completion until each applicable command is run successfully. If the repository does not yet provide a lint or typecheck command, add the appropriate script during the backend/frontend setup phase rather than skipping verification.

## 12. Definition of done

- The three services start from documented environment configuration.
- Authentication and authorization are secure and tested.
- All planned API endpoints return the standard envelope and correct status codes.
- MongoDB contains all planned collections with realistic fabricated history.
- Seed data is deterministic, inspectable through CSV fixtures, safely resettable, and relationally valid.
- ML can train and predict using a documented model version.
- The frontend builds, lints, navigates, displays seeded data, and supports risk/budget/goal workflows.
- No raw API fetch calls, secret logging, orphaned legacy components, or undocumented destructive seed behavior remain.
- Documentation explains setup, seeding, model training, API usage, and demo credentials.
