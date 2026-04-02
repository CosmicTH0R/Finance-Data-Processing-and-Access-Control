# API Documentation

All responses follow the same uniform shape:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": {...} } }
```

All protected endpoints require: `Authorization: Bearer <token>`

---

## Auth

### POST /api/auth/register
Register a new user. Default role is `VIEWER`.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "Test@1234",
  "name": "Jane Doe"
}
```
- `password`: min 8 chars, must contain uppercase letter and number

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "uuid", "email": "user@example.com", "name": "Jane Doe", "role": "VIEWER", "status": "ACTIVE", "createdAt": "..." }
  }
}
```

**Errors:** `400 VALIDATION_ERROR`, `409 CONFLICT` (duplicate email)

---

### POST /api/auth/login
Login and receive a JWT.

**Request body:**
```json
{ "email": "admin@test.com", "password": "Admin@123" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "uuid", "email": "admin@test.com", "name": "Admin", "role": "ADMIN", ... }
  }
}
```

**Errors:** `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`, `403 ACCOUNT_INACTIVE`

---

## Users

### GET /api/users/me
Returns the authenticated user's own profile.

**Response `200`:**
```json
{
  "success": true,
  "data": { "id": "uuid", "email": "...", "name": "...", "role": "VIEWER", "status": "ACTIVE", "createdAt": "...", "updatedAt": "..." }
}
```

---

### GET /api/users `[Admin]`
Paginated list of all users with optional filters.

**Query params:** `role=ADMIN|ANALYST|VIEWER`, `status=ACTIVE|INACTIVE`, `page=1`, `limit=20`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "users": [ { "id": "uuid", "email": "...", "name": "...", "role": "ADMIN", "status": "ACTIVE", ... } ],
    "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
  }
}
```

---

### GET /api/users/:id `[Admin]`
Get a single user by UUID.

**Response `200`:** Same shape as single user object.
**Errors:** `400 VALIDATION_ERROR` (invalid UUID), `404 NOT_FOUND`

---

### PATCH /api/users/:id `[Admin]`
Partially update a user's role, status, or name.

**Request body (all fields optional):**
```json
{ "role": "ANALYST", "status": "INACTIVE", "name": "Updated Name" }
```

**Response `200`:** Updated user object.
**Errors:** `400 VALIDATION_ERROR`, `404 NOT_FOUND`

---

### DELETE /api/users/:id `[Admin]`
Soft deactivate a user (sets `status = INACTIVE`). Cannot deactivate yourself.

**Response `200`:** Deactivated user object.
**Errors:** `400 SELF_DEACTIVATION`, `404 NOT_FOUND`, `409 CONFLICT` (already inactive)

---

## Financial Records

### POST /api/records `[Admin]`
Create a new financial record linked to the authenticated admin.

**Request body:**
```json
{
  "amount": 5000.00,
  "type": "INCOME",
  "category": "Salary",
  "date": "2025-11-01T00:00:00.000Z",
  "description": "November salary"
}
```
- `amount`: positive number, max 2 decimal places
- `type`: `INCOME` or `EXPENSE`
- `date`: ISO 8601, must not be in the future
- `description`: optional, max 500 chars

**Response `201`:**
```json
{
  "success": true,
  "message": "Record created successfully",
  "data": {
    "record": { "id": "uuid", "amount": "5000.00", "type": "INCOME", "category": "Salary", "date": "...", "user": { "id": "...", "name": "Admin", "email": "..." }, ... }
  }
}
```

**Errors:** `400 VALIDATION_ERROR`, `403 FORBIDDEN`

---

### GET /api/records `[Any auth]`
Paginated list of records with filtering and sorting.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `type` | `INCOME\|EXPENSE` | — | Filter by record type |
| `category` | string | — | Case-insensitive partial match |
| `startDate` | ISO 8601 | — | Records on or after this date |
| `endDate` | ISO 8601 | — | Records on or before this date |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Page size (max 100) |
| `sortBy` | `date\|amount\|createdAt` | `date` | Sort field |
| `sortOrder` | `asc\|desc` | `desc` | Sort direction |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "records": [ { "id": "...", "amount": "5000.00", "type": "INCOME", "category": "Salary", ... } ],
    "pagination": { "page": 1, "limit": 20, "total": 24, "totalPages": 2 }
  }
}
```

---

### GET /api/records/:id `[Any auth]`
Get a single record by UUID. Returns 404 for soft-deleted records.

**Response `200`:** Single record object.
**Errors:** `400 VALIDATION_ERROR` (invalid UUID), `404 NOT_FOUND`

---

### PATCH /api/records/:id `[Admin]`
Partial update — only provided fields are updated and validated.

**Request body (all optional, at least one required):**
```json
{ "amount": 6000, "category": "Bonus", "description": "Q4 bonus" }
```

**Response `200`:** Updated record object.
**Errors:** `400 VALIDATION_ERROR`, `404 NOT_FOUND`

---

### DELETE /api/records/:id `[Admin]`
Soft delete — sets `isDeleted = true`. Record is hidden from all GET queries but preserved in the database.

**Response `200`:** Deleted record object (with `isDeleted: true`).
**Errors:** `400 VALIDATION_ERROR`, `404 NOT_FOUND`

---

## Dashboard

### GET /api/dashboard/summary `[Analyst, Admin]`
Aggregated financial totals across all non-deleted records.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 52000.00,
    "totalExpenses": 31500.00,
    "netBalance": 20500.00,
    "recordCount": 24
  }
}
```

---

### GET /api/dashboard/category-summary `[Analyst, Admin]`
Income and expense totals grouped by category and type.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "categories": [
      { "category": "Salary", "type": "INCOME", "total": 36000.00, "count": 6 },
      { "category": "Rent", "type": "EXPENSE", "total": 12000.00, "count": 6 }
    ]
  }
}
```

---

### GET /api/dashboard/trends `[Analyst, Admin]`
Monthly income, expenses, and net for the last N months.

**Query params:** `months=6` (1–24, default 6)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "trends": [
      { "month": "2025-06", "income": 8000, "expenses": 5000, "net": 3000 },
      { "month": "2025-07", "income": 9000, "expenses": 5500, "net": 3500 }
    ]
  }
}
```

---

### GET /api/dashboard/recent `[Any auth]`
Most recent N financial records ordered by date descending.

**Query params:** `limit=10` (1–50, default 10)

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "records": [
      { "id": "uuid", "amount": "5000.00", "type": "INCOME", "category": "Salary", "date": "...", "user": { "id": "...", "name": "Admin", "email": "..." } }
    ]
  }
}
```

---

## Error Codes Reference

| HTTP | Code | Cause |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod schema validation failed — `details` contains per-field errors |
| 400 | `BAD_REQUEST` | Malformed JSON body or invalid ID format |
| 400 | `SELF_DEACTIVATION` | Admin attempted to deactivate their own account |
| 401 | `UNAUTHORIZED` | Missing, malformed, or expired JWT |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password |
| 403 | `FORBIDDEN` | Authenticated but insufficient role |
| 403 | `ACCOUNT_INACTIVE` | User account has been deactivated |
| 404 | `NOT_FOUND` | Resource does not exist or is soft-deleted |
| 409 | `CONFLICT` | Duplicate email on register, or user already inactive |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
