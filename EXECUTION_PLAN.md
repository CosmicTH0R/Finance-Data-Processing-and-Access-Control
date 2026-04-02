# Finance Dashboard Backend — Execution Plan

---

## Tech Stack (Simple, Impressive, Fast to Build)

| Layer | Choice | Why |
|---|---|---|
| **Language** | TypeScript | Type safety, clean code, shows maturity |
| **Framework** | Express.js + ts-node | Industry standard, fast to scaffold |
| **Database** | PostgreSQL | Relational fits finance data perfectly; shows proper data modeling |
| **ORM** | Prisma | Type-safe queries, clean migrations, auto-generated client |
| **Auth** | JWT (jsonwebtoken + bcrypt) | Stateless, simple, standard |
| **Validation** | Zod | Composable, TypeScript-native, better than Joi for TS projects |
| **Testing** | Jest + Supertest | Unit + integration in one setup |
| **Docs** | Swagger (swagger-jsdoc + swagger-ui-express) | Auto-generated, interactive API docs |
| **Dev Tools** | ESLint, Prettier, dotenv, nodemon | Professional setup signals |

> **Alternative (if speed matters more):** Use SQLite via Prisma for zero-config DB. Mention it in README as a deliberate simplicity tradeoff.

---

## Folder Structure

```
finance-dashboard/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                  # Seed users + sample data
│   └── migrations/
├── src/
│   ├── index.ts                 # App entry, server start
│   ├── app.ts                   # Express app setup, middleware mounting
│   ├── config/
│   │   ├── env.ts               # Validated env vars (via Zod)
│   │   └── database.ts          # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   ├── rbac.ts              # Role-based access guard
│   │   ├── validate.ts          # Zod schema validation middleware
│   │   └── errorHandler.ts      # Global error handler
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts   # Zod schemas for login/register
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.routes.ts
│   │   │   └── user.schema.ts
│   │   ├── records/
│   │   │   ├── record.controller.ts
│   │   │   ├── record.service.ts
│   │   │   ├── record.routes.ts
│   │   │   └── record.schema.ts
│   │   └── dashboard/
│   │       ├── dashboard.controller.ts
│   │       ├── dashboard.service.ts
│   │       └── dashboard.routes.ts
│   ├── utils/
│   │   ├── apiResponse.ts       # Consistent response shape
│   │   └── AppError.ts          # Custom error class
│   └── types/
│       └── express.d.ts         # Extend Request with user
├── tests/
│   ├── auth.test.ts
│   ├── records.test.ts
│   ├── dashboard.test.ts
│   └── helpers/
│       └── setup.ts             # Test DB setup/teardown
├── .env.example
├── .gitignore
├── tsconfig.json
├── jest.config.ts
├── package.json
├── Dockerfile                   # Optional bonus
├── README.md
└── API_DOCUMENTATION.md         # If not using Swagger
```

**Why module-based (not layer-based)?** Keeps related code co-located. Each module owns its controller → service → schema → routes. Evaluators see clean separation of concerns immediately.

---

## PHASE 1: Foundation & Data Modeling

**Goal:** Runnable project with DB schema, seed data, and health check.

### Task 1.1 — Project Scaffolding ✅

| | |
|---|---|
| **What** | `npm init`, install deps, configure TypeScript, ESLint, Prettier, `.env`, `.gitignore` |
| **Why** | First impression. A clean `package.json` and config shows professionalism. |
| **Output** | Project compiles with `npm run dev`, `GET /health` returns `{ status: "ok" }` |

**Dependencies to install:**
```
express @types/express typescript ts-node nodemon
prisma @prisma/client
jsonwebtoken @types/jsonwebtoken bcryptjs @types/bcryptjs
zod
dotenv
```

### Task 1.2 — Database Schema Design ✅

| | |
|---|---|
| **What** | Design Prisma schema with `User`, `FinancialRecord` models + enums |
| **Why** | **Highest-impact task.** Data modeling is an explicit evaluation criterion. Get this right first. |
| **Output** | `prisma/schema.prisma` with relations, enums, indexes, timestamps |

**Key schema decisions:**

```prisma
enum Role {
  VIEWER
  ANALYST
  ADMIN
}

enum RecordType {
  INCOME
  EXPENSE
}

enum UserStatus {
  ACTIVE
  INACTIVE
}

model User {
  id        String     @id @default(uuid())
  email     String     @unique
  password  String
  name      String
  role      Role       @default(VIEWER)
  status    UserStatus @default(ACTIVE)
  records   FinancialRecord[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([role])
  @@index([status])
}

model FinancialRecord {
  id          String     @id @default(uuid())
  amount      Decimal    @db.Decimal(12, 2)   // Not Float!
  type        RecordType
  category    String
  date        DateTime
  description String?
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  isDeleted   Boolean    @default(false)       // Soft delete
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([type])
  @@index([category])
  @@index([date])
  @@index([userId])
  @@index([isDeleted])
}
```

**Critical modeling decisions to document in README:**
- `Decimal(12,2)` not `Float` — floats cause rounding errors in finance
- UUIDs not auto-increment — secure, no ID enumeration
- Soft delete via `isDeleted` flag — finance data should never be hard-deleted
- Indexes on filter-heavy columns — shows awareness of query performance

### Task 1.3 — Prisma Client + Seed Script ✅

| | |
|---|---|
| **What** | Create singleton Prisma client, write seed script with sample users (one per role) and ~20 financial records |
| **Why** | Evaluator can immediately run the project and see data. Removes friction from review. |
| **Output** | `npx prisma db seed` populates DB; 3 users (admin/analyst/viewer) with known credentials |

### Task 1.4 — App Bootstrap ✅

| | |
|---|---|
| **What** | `app.ts` with Express setup: JSON body parser, CORS, request logging, route mounting, global error handler |
| **Why** | Clean app initialization shows architectural thinking |
| **Output** | `app.ts` exports configured Express app, `index.ts` starts the server |

---

## PHASE 2: Auth & User Management

**Goal:** JWT auth flow + user CRUD with role assignment.

### Task 2.1 — Auth Module (Register + Login) ✅

| | |
|---|---|
| **What** | `POST /api/auth/register` and `POST /api/auth/login` |
| **Why** | Foundation for all access control. Without this, RBAC is meaningless. |
| **Output** | Register creates user (hashed password), Login returns JWT with `{ id, role }` in payload |

**Validation (Zod):**
- Email: valid format, unique
- Password: min 8 chars
- Name: required, trimmed

**Important:** Hash password with bcrypt (cost factor 10+). Never store plaintext.

### Task 2.2 — Auth Middleware ✅

| | |
|---|---|
| **What** | `auth.ts` middleware that extracts JWT from `Authorization: Bearer <token>`, verifies, attaches `req.user` |
| **Why** | Every protected route depends on this |
| **Output** | Middleware that returns 401 for missing/invalid token, populates `req.user = { id, role }` |

### Task 2.3 — RBAC Middleware ✅

| | |
|---|---|
| **What** | `rbac.ts` — a factory function: `authorize(...allowedRoles: Role[])` returns middleware |
| **Why** | **Access control is an explicit evaluation criterion.** This is the core of it. |
| **Output** | `authorize(Role.ADMIN)` blocks non-admins with 403 |

**Usage pattern:**
```ts
router.post("/records", auth, authorize(Role.ADMIN), validate(createRecordSchema), controller.create);
```
This reads clearly: authenticate → check role → validate input → handle request.

### Task 2.4 — User Management APIs ✅

| | |
|---|---|
| **What** | Admin-only user CRUD |
| **Why** | Shows complete role management capability |
| **Output** | Endpoints below |

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/users` | Admin | List all users (paginated) |
| GET | `/api/users/:id` | Admin | Get user detail |
| PATCH | `/api/users/:id` | Admin | Update role / status |
| DELETE | `/api/users/:id` | Admin | Deactivate user (soft) |
| GET | `/api/users/me` | Any authenticated | Get own profile |

**Edge case:** Admin cannot deactivate themselves. Handle this explicitly — shows defensive programming.

---

## PHASE 3: Financial Records CRUD

**Goal:** Full CRUD with filtering, pagination, soft delete.

### Task 3.1 — Create Record ✅

| | |
|---|---|
| **What** | `POST /api/records` — Admin only |
| **Why** | Core business operation |
| **Output** | Creates record linked to authenticated user, returns created record |

**Zod schema validation:**
- `amount`: positive number, max 2 decimal places
- `type`: must be `INCOME` or `EXPENSE`
- `category`: non-empty string
- `date`: valid ISO date, not in future
- `description`: optional, max 500 chars

### Task 3.2 — Get Records (List + Filters + Pagination) ✅

| | |
|---|---|
| **What** | `GET /api/records` — Viewer, Analyst, Admin |
| **Why** | **This is where you show query design skill.** Filters + pagination are standard expectations. |
| **Output** | Paginated list with filter support |

**Query parameters:**
```
GET /api/records?type=INCOME&category=Salary&startDate=2025-01-01&endDate=2025-12-31&page=1&limit=20&sortBy=date&sortOrder=desc
```

**Response shape:**
```json
{
  "success": true,
  "data": {
    "records": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 87,
      "totalPages": 5
    }
  }
}
```

### Task 3.3 — Get Single Record ✅

| | |
|---|---|
| **What** | `GET /api/records/:id` — Any authenticated |
| **Why** | Standard REST pattern |
| **Output** | Single record or 404 |

### Task 3.4 — Update Record ✅

| | |
|---|---|
| **What** | `PATCH /api/records/:id` — Admin only |
| **Why** | Partial update with validation. Shows you understand PATCH vs PUT. |
| **Output** | Updated record. Validate only provided fields. |

### Task 3.5 — Delete Record (Soft) ✅

| | |
|---|---|
| **What** | `DELETE /api/records/:id` — Admin only |
| **Why** | Soft delete shows domain awareness — financial data shouldn't be permanently removed |
| **Output** | Sets `isDeleted: true`. All GET queries must filter `isDeleted: false` by default. |

---

## PHASE 4: Dashboard Summary APIs

**Goal:** Aggregation endpoints that prove you can do more than CRUD.

### ✅ Task 4.1 — Financial Summary

| | |
|---|---|
| **What** | `GET /api/dashboard/summary` — Analyst + Admin |
| **Why** | **This differentiates you.** Most candidates stop at CRUD. Aggregation shows real backend skill. |
| **Output** | Aggregated totals |

```json
{
  "totalIncome": 50000.00,
  "totalExpenses": 32000.00,
  "netBalance": 18000.00,
  "recordCount": 87
}
```

**Implementation:** Use Prisma `aggregate` or raw SQL `SUM(CASE WHEN type = 'INCOME' ...)`.

### ✅ Task 4.2 — Category Breakdown

| | |
|---|---|
| **What** | `GET /api/dashboard/category-summary` — Analyst + Admin |
| **Why** | Shows GROUP BY capability |
| **Output** | Category-wise income/expense totals |

```json
{
  "categories": [
    { "category": "Salary", "type": "INCOME", "total": 40000.00, "count": 4 },
    { "category": "Rent", "type": "EXPENSE", "total": 12000.00, "count": 3 }
  ]
}
```

### ✅ Task 4.3 — Monthly Trends

| | |
|---|---|
| **What** | `GET /api/dashboard/trends?months=6` — Analyst + Admin |
| **Why** | Time-series aggregation — most impressive dashboard API |
| **Output** | Monthly income/expense/net for last N months |

```json
{
  "trends": [
    { "month": "2025-10", "income": 8000, "expenses": 5000, "net": 3000 },
    { "month": "2025-11", "income": 9000, "expenses": 6000, "net": 3000 }
  ]
}
```

### ✅ Task 4.4 — Recent Activity

| | |
|---|---|
| **What** | `GET /api/dashboard/recent?limit=10` — All authenticated |
| **Why** | Simple but useful — shows thoughtful API design |
| **Output** | Last N records, ordered by date descending |

---

## PHASE 5: Validation, Error Handling & Hardening

**Goal:** Make the API behave correctly under bad input and edge cases.

### ✅ Task 5.1 — Global Error Handler

| | |
|---|---|
| **What** | Centralized error handling middleware |
| **Why** | Explicit evaluation criterion. Consistent error responses matter. |
| **Output** | All errors return uniform shape |

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Amount must be a positive number",
    "details": [...]  // Optional: per-field errors
  }
}
```

**Error types to handle:**
- `400` — Validation errors (Zod)
- `401` — Authentication errors
- `403` — Authorization errors
- `404` — Resource not found
- `409` — Conflict (duplicate email)
- `500` — Unexpected errors (log stack trace, return generic message)

### ✅ Task 5.2 — Validation Middleware

| | |
|---|---|
| **What** | Generic `validate(schema)` middleware that validates `req.body`, `req.query`, or `req.params` against Zod schemas |
| **Why** | DRY validation, reusable across all routes |
| **Output** | Invalid requests rejected before reaching controller |

### ✅ Task 5.3 — Edge Case Protection

| | |
|---|---|
| **What** | Handle: inactive user login, self-deactivation, accessing deleted records, invalid UUIDs, duplicate emails |
| **Why** | Shows you think beyond happy path |
| **Output** | Appropriate error responses for each case |

---

## PHASE 6: Testing

**Goal:** Prove the system works. Tests are optional but massively boost evaluation score.

### ✅ Task 6.1 — Test Setup

| | |
|---|---|
| **What** | Jest + Supertest config, test database, setup/teardown helpers |
| **Why** | Tests signal engineering maturity |
| **Output** | `npm test` runs cleanly |

### ✅ Task 6.2 — Auth Tests

| | |
|---|---|
| **What** | Register, login, invalid credentials, expired token |
| **Output** | 5-8 test cases |

### ✅ Task 6.3 — RBAC Tests

| | |
|---|---|
| **What** | Viewer can't create records, Analyst can read summaries, Admin has full access |
| **Output** | Permission matrix tested |

### ✅ Task 6.4 — Records CRUD Tests

| | |
|---|---|
| **What** | Create, read, update, soft-delete, filters, pagination |
| **Output** | 8-12 test cases |

### ✅ Task 6.5 — Dashboard Tests

| | |
|---|---|
| **What** | Summary correctness, category breakdown, trends |
| **Output** | 4-6 test cases |

---

## PHASE 7: Documentation & Submission Polish

**Goal:** Make the evaluator's job easy. This phase directly impacts scoring.

### Task 7.1 — README.md ✅

| | |
|---|---|
| **What** | Comprehensive, well-structured README |
| **Why** | **Documentation is an explicit evaluation criterion.** This is the first file they read. |

**README must include:**
1. Project overview (2-3 sentences)
2. Tech stack table with justifications
3. Setup instructions (copy-pasteable commands)
4. Environment variables (`.env.example`)
5. Seed data explanation (pre-created users/credentials)
6. API endpoint table
7. Architecture overview (folder structure explanation)
8. Design decisions & assumptions
9. Tradeoffs made and why

### Task 7.2 — API Documentation ✅

| | |
|---|---|
| **What** | Swagger UI at `/api-docs` OR a clean `API_DOCUMENTATION.md` |
| **Why** | Interactive docs impress; static docs are acceptable |
| **Output** | Every endpoint documented with request/response examples |

### Task 7.3 — .env.example ✅

| | |
|---|---|
| **What** | Template env file with all required variables (no real secrets) |
| **Why** | Evaluator should never have to guess configuration |

```env
DATABASE_URL=postgresql://user:password@localhost:5432/finance_dashboard
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

### Task 7.4 — Seed Data with Known Credentials ✅

| | |
|---|---|
| **What** | Document test credentials in README |
| **Why** | Evaluator can immediately test all roles |

```
Admin:   admin@test.com   / Admin@123
Analyst: analyst@test.com / Analyst@123
Viewer:  viewer@test.com  / Viewer@123
```

### Task 7.5 — HTTP Test File ✅

| | |
|---|---|
| **What** | `test-scenarios.http` (VS Code REST Client format) or Postman collection |
| **Why** | Evaluator can test every endpoint in seconds without writing curl commands |

---

## Common Mistakes to Avoid

| Mistake | Impact | Fix |
|---------|--------|-----|
| Using `Float` for money | Data corruption, rounding errors | Use `Decimal(12,2)` |
| Storing passwords in plaintext | Instant rejection | bcrypt with 10+ rounds |
| No consistent response format | Looks amateur | Wrap every response in `{ success, data/error }` |
| Hardcoded secrets in code | Security red flag | Use `.env` + config module |
| No input validation | Evaluation criterion missed | Zod on every mutation endpoint |
| Returning password in user objects | Security flaw | Always exclude password in selects |
| No pagination on list endpoints | Won't scale | Default to `page=1, limit=20` |
| RBAC only in frontend/docs | Pointless | Enforce in middleware, every request |
| Catching errors silently | Hides bugs | Let errors propagate to global handler |
| No seed data | Evaluator has to create their own data | Seed 3 users + 20 records |
| `any` types everywhere | Defeats TypeScript purpose | Properly type request/response |
| Giant controller functions | Bad separation of concerns | Thin controllers, fat services |
| No soft delete for finance data | Missing domain awareness | `isDeleted` flag + filter in queries |
| Missing `updatedAt` / audit fields | No traceability | Add timestamps on all models |

---

## Bonus Improvements (High-Impact, Low-Effort)

| Bonus | Effort | Impact | How |
|-------|--------|--------|-----|
| **Swagger UI** | 1 hour | Very High | `swagger-jsdoc` + `swagger-ui-express` |
| **Request logging** | 15 min | High | `morgan` in dev, structured JSON in prod |
| **Rate limiting** | 15 min | High | `express-rate-limit` on auth routes |
| **Dockerfile** | 20 min | High | Shows deployment awareness |
| **Health check endpoint** | 5 min | Medium | `GET /health` with DB ping |
| **Pagination metadata** | 10 min | Medium | `totalPages`, `hasNext`, `hasPrev` |
| **Search on records** | 20 min | Medium | Full-text search on description/category |
| **Audit trail** | 30 min | High | `createdBy` / `updatedBy` fields |
| **Graceful shutdown** | 10 min | Medium | Handle `SIGTERM`, close DB connection |
| **Export endpoint** | 30 min | Medium | `GET /api/records/export?format=csv` |

---

## RBAC Permission Matrix

Document this in your README — evaluators love clarity on access rules.

| Endpoint | Viewer | Analyst | Admin |
|----------|--------|---------|-------|
| `POST /auth/register` | Public | Public | Public |
| `POST /auth/login` | Public | Public | Public |
| `GET /users/me` | Yes | Yes | Yes |
| `GET /users` | No | No | Yes |
| `PATCH /users/:id` | No | No | Yes |
| `POST /records` | No | No | Yes |
| `GET /records` | Yes | Yes | Yes |
| `PATCH /records/:id` | No | No | Yes |
| `DELETE /records/:id` | No | No | Yes |
| `GET /dashboard/summary` | No | Yes | Yes |
| `GET /dashboard/categories` | No | Yes | Yes |
| `GET /dashboard/trends` | No | Yes | Yes |
| `GET /dashboard/recent` | Yes | Yes | Yes |

---

## Final Submission Checklist

### Must Have (will fail without these)
- [ ] `npm install` → `npm run dev` works first try
- [ ] Database migration runs without errors
- [ ] Seed script creates test users and records
- [ ] All CRUD operations functional
- [ ] Role-based access enforced (not just documented)
- [ ] Input validation on all mutation endpoints
- [ ] Consistent error response format
- [ ] `.env.example` with all variables
- [ ] README with setup instructions and API docs

### Should Have (significantly boosts score)
- [ ] Dashboard summary APIs (totals, categories, trends)
- [ ] JWT authentication working end-to-end
- [ ] Pagination on list endpoints
- [ ] Soft delete on financial records
- [ ] Proper TypeScript types (no `any`)
- [ ] Zod validation schemas for all inputs
- [ ] Global error handling middleware
- [ ] Test credentials documented

### Nice to Have (differentiators)
- [ ] Integration tests passing (`npm test`)
- [ ] Swagger UI at `/api-docs`
- [ ] HTTP test file / Postman collection
- [ ] Dockerfile
- [ ] Rate limiting on auth routes
- [ ] Request logging
- [ ] Deployed to a free tier (Render, Railway)
- [ ] Clean git history (meaningful commits, not one giant commit)

### Before Pushing
- [ ] Remove all `console.log` debugging statements
- [ ] No secrets in committed code (check `.env` is gitignored)
- [ ] `npm run build` succeeds without errors
- [ ] `npm run lint` passes
- [ ] Password field excluded from all API responses
- [ ] Every endpoint tested manually at least once
- [ ] README reviewed for typos and completeness

---

## Execution Timeline (Suggested Order)

```
Phase 1: Foundation        ██████░░░░░░░░░░░░░░  (~2 hours)
Phase 2: Auth + Users      ████████░░░░░░░░░░░░  (~3 hours)
Phase 3: Records CRUD      ████████████░░░░░░░░  (~2 hours)
Phase 4: Dashboard APIs    ████████████████████  ✅ COMPLETE
Phase 5: Hardening         ████████████████████  ✅ COMPLETE
Phase 6: Testing           ████████████████████  ✅ COMPLETE
Phase 7: Documentation     ████████████████████  (~1.5 hours)
```

**Total: ~14 hours of focused work**

Start with Phase 1-4 to get a working system. Then harden and document. Tests last (they're optional but valuable).
