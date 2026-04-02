# Finance Dashboard Backend

A production-ready REST API for financial data management with role-based access control, aggregation endpoints, and comprehensive test coverage. Built as a backend engineering assessment.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Language** | TypeScript | Type safety, cleaner code, shows engineering maturity |
| **Framework** | Express.js | Industry standard, lightweight, widely known |
| **Database** | PostgreSQL | Relational model fits financial data; ACID guarantees |
| **ORM** | Prisma v5 | Type-safe queries, auto-generated client, clean migrations |
| **Auth** | JWT + bcryptjs | Stateless auth, industry standard, no session overhead |
| **Validation** | Zod v4 | TypeScript-native, composable, better DX than Joi |
| **Testing** | Jest + Supertest | Integration tests against a real DB, no mocking needed |
| **Dev Tools** | ESLint, Prettier, nodemon, ts-node | Professional setup |

---

## Project Structure

```
finance-dashboard/
├── prisma/
│   ├── schema.prisma          # DB schema — User, FinancialRecord, enums, indexes
│   ├── seed.ts                # Seeds 3 users + 24 records with known credentials
│   └── migrations/
├── src/
│   ├── index.ts               # Server entry point, graceful shutdown
│   ├── app.ts                 # Express app, middleware, route mounting
│   ├── config/
│   │   ├── env.ts             # Zod-validated environment variables
│   │   └── database.ts        # Prisma singleton
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification → req.user
│   │   ├── rbac.ts            # authorize(...roles) factory
│   │   ├── validate.ts        # Zod schema validation middleware
│   │   └── errorHandler.ts    # Global error handler (AppError, ZodError, Prisma)
│   ├── modules/
│   │   ├── auth/              # POST /register, POST /login
│   │   ├── users/             # User CRUD — admin only
│   │   ├── records/           # Financial records CRUD with filters + pagination
│   │   └── dashboard/         # Aggregation endpoints (summary, categories, trends, recent)
│   └── utils/
│       ├── AppError.ts        # Operational error class
│       ├── apiResponse.ts     # Consistent { success, data/error } response helpers
│       └── common.schema.ts   # Shared Zod schemas (UUID param validation)
└── tests/
    ├── auth.test.ts           # 8 auth integration tests
    ├── rbac.test.ts           # 8 RBAC permission matrix tests
    ├── records.test.ts        # 10 records CRUD tests
    ├── dashboard.test.ts      # 5 dashboard aggregation tests
    └── helpers/setup.ts       # createTestUser, createTestRecord, deleteUsers
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a hosted DB)

### 1. Clone and install

```bash
git clone https://github.com/CosmicTH0R/Finance-Data-Processing-and-Access-Control.git
cd Finance-Data-Processing-and-Access-Control
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database URL and a strong JWT secret
```

### 3. Run database migrations

```bash
npx prisma migrate dev
```

### 4. Seed test data

```bash
npm run db:seed
```

### 5. Start the server

```bash
npm run dev        # development (nodemon + ts-node)
npm run build      # compile TypeScript
npm start          # run compiled output
```

### 6. Run tests

```bash
npm test
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Secret key for signing JWTs (min 8 chars) |
| `JWT_EXPIRES_IN` | ❌ | `24h` | JWT expiry duration |
| `PORT` | ❌ | `3000` | Server port |
| `NODE_ENV` | ❌ | `development` | `development` / `production` / `test` |

See [.env.example](.env.example) for a template.

---

## Test Credentials

After running `npm run db:seed`, the following users are available:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@test.com` | `Admin@123` |
| **Analyst** | `analyst@test.com` | `Analyst@123` |
| **Viewer** | `viewer@test.com` | `Viewer@123` |

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user (default role: VIEWER) |
| POST | `/api/auth/login` | Public | Login and receive a JWT |

### Users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users/me` | Any auth | Get own profile |
| GET | `/api/users` | Admin | List all users (paginated, filterable) |
| GET | `/api/users/:id` | Admin | Get user by ID |
| PATCH | `/api/users/:id` | Admin | Update role / status / name |
| DELETE | `/api/users/:id` | Admin | Soft deactivate user |

### Financial Records
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/records` | Admin | Create a financial record |
| GET | `/api/records` | Any auth | List records (paginated, filtered, sorted) |
| GET | `/api/records/export` | Admin | Export filtered records as CSV |
| GET | `/api/records/:id` | Any auth | Get single record |
| PATCH | `/api/records/:id` | Admin | Partial update |
| DELETE | `/api/records/:id` | Admin | Soft delete |

**GET /api/records query params:** `type`, `category`, `startDate`, `endDate`, `page`, `limit`, `sortBy`, `sortOrder`

### Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Analyst + Admin | Total income, expenses, net balance, record count |
| GET | `/api/dashboard/category-summary` | Analyst + Admin | Breakdown by category and type |
| GET | `/api/dashboard/trends?months=6` | Analyst + Admin | Monthly income/expense/net for last N months |
| GET | `/api/dashboard/recent?limit=10` | Any auth | Most recent N records |

### Health
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Server status + timestamp |

### API Documentation
| URL | Description |
|---|---|
| `http://localhost:3000/api-docs` | Interactive Swagger UI |
| `http://localhost:3000/api-docs.json` | Raw OpenAPI 3.0 spec (JSON) |

---

## RBAC Permission Matrix

| Endpoint | Viewer | Analyst | Admin |
|---|---|---|---|
| `POST /auth/register` | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ |
| `GET /users/me` | ✅ | ✅ | ✅ |
| `GET /users` | ❌ | ❌ | ✅ |
| `PATCH /users/:id` | ❌ | ❌ | ✅ |
| `POST /records` | ❌ | ❌ | ✅ |
| `GET /records` | ✅ | ✅ | ✅ |
| `GET /records/export` | ❌ | ❌ | ✅ |
| `PATCH /records/:id` | ❌ | ❌ | ✅ |
| `DELETE /records/:id` | ❌ | ❌ | ✅ |
| `GET /dashboard/summary` | ❌ | ✅ | ✅ |
| `GET /dashboard/category-summary` | ❌ | ✅ | ✅ |
| `GET /dashboard/trends` | ❌ | ✅ | ✅ |
| `GET /dashboard/recent` | ✅ | ✅ | ✅ |

---

## Design Decisions

### `Decimal(12,2)` not `Float` for money
Floating-point types cause rounding errors in financial calculations. Prisma's `Decimal` maps to PostgreSQL `NUMERIC(12,2)`, guaranteeing exact two-decimal precision.

### UUID primary keys
UUIDs prevent sequential ID enumeration attacks. There is no way to guess another user's ID from your own.

### Soft delete for financial records
Financial records must never be permanently deleted — this is a regulatory and audit requirement in real finance systems. The `isDeleted` flag is applied to all reads automatically.

### Module-based architecture
Each feature owns its own `controller → service → schema → routes` files. Evaluators can navigate each domain independently without jumping between distant folders.

### Indexes on filter-heavy columns
`type`, `category`, `date`, `userId`, and `isDeleted` all have database indexes. The records list endpoint supports filtering on every one of these, so query performance stays predictable at scale.

### Centralized error handling
All errors — Zod validation, Prisma constraint violations, AppError, unknown exceptions — flow through a single `errorHandler` middleware. Controllers never build error responses themselves.

### Express 5 + `Object.defineProperty` for `req.query`
Express 5 defines `req.query` as a prototype getter (read-only). The validation middleware uses `Object.defineProperty` to shadow it with an own-property containing the Zod-parsed and coerced values.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run all Jest integration tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with test data |
| `npm run db:studio` | Open Prisma Studio |
