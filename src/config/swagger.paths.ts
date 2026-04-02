/**
 * OpenAPI 3.0 path definitions for the Finance Dashboard API.
 * All API documentation lives here — route files stay clean.
 *
 * Structure mirrors the OpenAPI Paths Object spec:
 *   https://swagger.io/specification/#paths-object
 */

export const apiPaths: Record<string, Record<string, unknown>> = {
  // ─── Auth ──────────────────────────────────────────────────────────────────

  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user',
      description:
        'Creates a new user with the VIEWER role by default. Returns a JWT token on success.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'name'],
              properties: {
                email: { type: 'string', format: 'email', example: 'newuser@example.com' },
                password: {
                  type: 'string',
                  minLength: 8,
                  description: 'Must contain at least one uppercase letter and one number',
                  example: 'Test@1234',
                },
                name: { type: 'string', example: 'Jane Doe' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'User registered successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        409: {
          description: 'Email already registered',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login and receive a JWT token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'admin@test.com' },
                password: { type: 'string', example: 'Admin@123' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Login successful' },
                  data: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        401: {
          description: 'Invalid credentials',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        403: {
          description: 'Account inactive',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  // ─── Users ─────────────────────────────────────────────────────────────────

  '/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Get own profile',
      description: "Returns the authenticated user's own profile. Available to all roles.",
      responses: {
        200: {
          description: 'Own profile',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  '/users': {
    get: {
      tags: ['Users'],
      summary: 'List all users (Admin only)',
      description: 'Paginated list of all users with optional role/status filters.',
      parameters: [
        { in: 'query', name: 'role', schema: { type: 'string', enum: ['ADMIN', 'ANALYST', 'VIEWER'] } },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        200: {
          description: 'Paginated user list',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
          },
        },
        403: {
          description: 'Forbidden',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  '/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get user by ID (Admin only)',
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: {
          description: 'User found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        404: {
          description: 'User not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    patch: {
      tags: ['Users'],
      summary: 'Update user role/status/name (Admin only)',
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['ADMIN', 'ANALYST', 'VIEWER'] },
                status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                name: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'User updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        404: {
          description: 'User not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    delete: {
      tags: ['Users'],
      summary: 'Deactivate user (Admin only)',
      description: 'Soft deactivates a user (sets status to INACTIVE). Cannot deactivate yourself.',
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: {
          description: 'User deactivated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        400: {
          description: 'Cannot deactivate yourself',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        404: {
          description: 'User not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  // ─── Financial Records ─────────────────────────────────────────────────────

  '/records': {
    post: {
      tags: ['Records'],
      summary: 'Create a financial record (Admin only)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['amount', 'type', 'category', 'date'],
              properties: {
                amount: {
                  type: 'number',
                  example: 5000.0,
                  description: 'Positive number, max 2 decimal places',
                },
                type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                category: { type: 'string', example: 'Salary' },
                date: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-08-01T00:00:00.000Z',
                  description: 'ISO 8601, must not be in the future',
                },
                description: { type: 'string', example: 'August salary payment' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Record created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: { record: { $ref: '#/components/schemas/FinancialRecord' } },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
        403: {
          description: 'Forbidden — Admin only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    get: {
      tags: ['Records'],
      summary: 'List records with filters and pagination (all authenticated)',
      parameters: [
        { in: 'query', name: 'type', schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] } },
        {
          in: 'query',
          name: 'category',
          schema: { type: 'string' },
          description: 'Case-insensitive partial match',
        },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
        {
          in: 'query',
          name: 'sortBy',
          schema: { type: 'string', enum: ['date', 'amount', 'createdAt'], default: 'date' },
        },
        {
          in: 'query',
          name: 'sortOrder',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      ],
      responses: {
        200: {
          description: 'Paginated records list',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      records: { type: 'array', items: { $ref: '#/components/schemas/FinancialRecord' } },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  '/records/export': {
    get: {
      tags: ['Records'],
      summary: 'Export records as CSV (Admin only)',
      description:
        'Downloads all matching records as a CSV file. Accepts the same filters as GET /records (except pagination).',
      parameters: [
        { in: 'query', name: 'format', schema: { type: 'string', enum: ['csv'], default: 'csv' } },
        { in: 'query', name: 'type', schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] } },
        { in: 'query', name: 'category', schema: { type: 'string' } },
        { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
        { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
      ],
      responses: {
        200: {
          description: 'CSV file download',
          content: { 'text/csv': { schema: { type: 'string' } } },
        },
        403: {
          description: 'Forbidden — Admin only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  '/records/{id}': {
    get: {
      tags: ['Records'],
      summary: 'Get record by ID (all authenticated)',
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: {
          description: 'Record found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: { record: { $ref: '#/components/schemas/FinancialRecord' } },
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'Record not found or soft-deleted',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    patch: {
      tags: ['Records'],
      summary: 'Partial update of a record (Admin only)',
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                amount: { type: 'number', example: 6000.0 },
                type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                category: { type: 'string' },
                date: { type: 'string', format: 'date-time' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Record updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: { record: { $ref: '#/components/schemas/FinancialRecord' } },
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'Record not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
    delete: {
      tags: ['Records'],
      summary: 'Soft delete a record (Admin only)',
      description:
        'Sets isDeleted=true. Record is hidden from all queries but preserved in the database.',
      parameters: [
        { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: {
          description: 'Record soft-deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: { record: { $ref: '#/components/schemas/FinancialRecord' } },
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'Record not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────

  '/dashboard/summary': {
    get: {
      tags: ['Dashboard'],
      summary: 'Financial summary totals (Analyst + Admin)',
      description: 'Returns aggregated totals across all non-deleted financial records.',
      responses: {
        200: {
          description: 'Financial summary',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      totalIncome: { type: 'number', example: 52000.0 },
                      totalExpenses: { type: 'number', example: 31500.0 },
                      netBalance: { type: 'number', example: 20500.0 },
                      recordCount: { type: 'integer', example: 24 },
                    },
                  },
                },
              },
            },
          },
        },
        403: {
          description: 'Forbidden — Analyst or Admin only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  '/dashboard/category-summary': {
    get: {
      tags: ['Dashboard'],
      summary: 'Income and expense totals by category (Analyst + Admin)',
      responses: {
        200: {
          description: 'Category breakdown',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      categories: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            category: { type: 'string', example: 'Salary' },
                            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                            total: { type: 'number', example: 36000.0 },
                            count: { type: 'integer', example: 6 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        403: {
          description: 'Forbidden — Analyst or Admin only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  '/dashboard/trends': {
    get: {
      tags: ['Dashboard'],
      summary: 'Monthly income/expense trends (Analyst + Admin)',
      parameters: [
        {
          in: 'query',
          name: 'months',
          schema: { type: 'integer', minimum: 1, maximum: 24, default: 6 },
          description: 'Number of past months to include',
        },
      ],
      responses: {
        200: {
          description: 'Monthly trends',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      trends: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: { type: 'string', example: '2025-06' },
                            income: { type: 'number', example: 8000 },
                            expenses: { type: 'number', example: 5000 },
                            net: { type: 'number', example: 3000 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        403: {
          description: 'Forbidden — Analyst or Admin only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },

  '/dashboard/recent': {
    get: {
      tags: ['Dashboard'],
      summary: 'Most recent financial records (all authenticated)',
      parameters: [
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
        },
      ],
      responses: {
        200: {
          description: 'Recent records',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      records: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/FinancialRecord' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
        },
      },
    },
  },
};
