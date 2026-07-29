# Orbital Ops Portal — Mini ERP + CRM Operations System

> **Full-stack ERP/CRM for wholesale/distribution operations**  
> Built for the Full Stack Developer Case Study  
> **Date:** July 29, 2026

---

## 📋 Table of Contents

1. [Submission Links](#-submission-links)
2. [Project Overview](#-project-overview)
3. [Tech Stack](#-tech-stack)
4. [Architecture](#%EF%B8%8F-architecture)
5. [Core Modules](#-core-modules)
6. [Bonus Features](#-bonus-features)
7. [API Documentation](#-api-documentation)
8. [Database Schema](#-database-schema)
9. [Login Credentials](#-login-credentials)
10. [Local Setup (without Docker)](#-local-setup-without-docker)
11. [Local Setup (with Docker)](#-local-setup-with-docker)
12. [Deployment Guide](#-deployment-guide)
13. [Environment Variables](#-environment-variables)
14. [Project Structure](#-project-structure)
15. [Assumptions](#-assumptions)
16. [Known Limitations](#-known-limitations)

---

## 🌐 Submission Links

| Component | URL |
|---|---|
| **Live Frontend** | [https://erp-crm-portal-delta.vercel.app](https://erp-crm-portal-delta.vercel.app) |
| **Live Backend API** | [https://erp-crm-backend-pggl.onrender.com](https://erp-crm-backend-pggl.onrender.com) |
| **GitHub Repository** | [https://github.com/Saqlain70/erp-crm-portal](https://github.com/Saqlain70/erp-crm-portal) |
| **Postman Collection** | Included in repo: `postman_collection.json` |

---

## 📖 Project Overview

Orbital Ops Portal is a small internal ERP/CRM system built for a wholesale/distribution company. The system enables employees across sales, warehouse, and accounts teams to:

- **Manage customers** — track leads, active accounts, follow-ups, and customer history
- **Manage products & inventory** — track stock levels, movements, low-stock alerts
- **Create sales challans** — generate delivery challans with automatic stock deduction
- **Download invoices** — export confirmed challans as professional PDF invoices
- **Control access** — role-based permissions (Admin, Sales, Warehouse, Accounts)

The application follows a modern three-tier architecture with a React frontend, Express API backend, and PostgreSQL database, all containerized with Docker and deployed on free-tier cloud hosting.

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Backend Runtime** | Node.js 20 | JavaScript runtime |
| **Backend Language** | TypeScript 5.6 | Type safety |
| **Backend Framework** | Express.js 4.21 | HTTP server & routing |
| **ORM** | Prisma 5.20 | Database access & migrations |
| **Database** | PostgreSQL 16 (via Neon cloud) | Primary data store |
| **Frontend Framework** | React 19 | UI components |
| **Frontend Build** | Vite 8 | Dev server & production builds |
| **Frontend Language** | TypeScript 6.0 | Type safety |
| **Routing** | React Router 7 | Client-side navigation |
| **HTTP Client** | Axios 1.18 | API requests with auth interceptors |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs | Login & password hashing |
| **Validation** | express-validator | Request payload validation |
| **Security Headers** | helmet | HTTP security headers |
| **PDF Generation** | pdfkit 0.19 | Invoice PDF export |
| **File Uploads** | multer | Product image uploads |
| **Containerization** | Docker + Docker Compose | Local development environment |
| **CI/CD** | GitHub Actions | TypeScript typecheck & build on push |

### Hosting

| Service | Component | Plan |
|---|---|---|
| [Render](https://render.com) | Backend API | Free (512MB RAM, 0.1 CPU) |
| [Vercel](https://vercel.com) | Frontend SPA | Free (Hobby) |
| [Neon](https://neon.tech) | PostgreSQL database | Free (0.5GB storage) |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │               Vercel (CDN + Hosting)                │     │
│  │                                                      │     │
│  │  React SPA (Vite build → static files)               │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │     │
│  │  │  Pages   │  │Components│  │   AuthContext     │  │     │
│  │  │ (6 pages)│  │(Layout,  │  │ (JWT session,    │  │     │
│  │  │          │  │ Badges,  │  │  auto-logout on  │  │     │
│  │  │          │  │Protected │  │  401)            │  │     │
│  │  │          │  │ Route)   │  │                  │  │     │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │     │
│  │                         │                           │     │
│  │              ┌──────────▼──────────┐                │     │
│  │              │  api/client.ts      │                │     │
│  │              │  Axios instance     │                │     │
│  │              │  + Bearer token     │                │     │
│  │              │  interceptor        │                │     │
│  │              └─────────────────────┘                │     │
│  └──────────────────────┬───────────────────────────────┘     │
└─────────────────────────┼─────────────────────────────────────┘
                          │ HTTPS / JSON
                          │ Authorization: Bearer <jwt>
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                      SERVER (Render)                          │
│                                                              │
│  Express.js API ──── TypeScript ──── Prisma ORM              │
│                                                              │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │  Routes  │──▶│Middleware│──▶│Controllers│──▶│  Prisma  │ │
│  │          │   │          │   │           │   │  Client  │ │
│  │ /auth    │   │ JWT Auth │   │ authCtrl  │   └────▲─────┘ │
│  │ /customers│  │ Role Guard│  │ customerCtrl│       │       │
│  │ /products│   │ Validator│   │ productCtrl│       │       │
│  │ /challans│   │ Error    │   │ challanCtrl│       │       │
│  │ /uploads │   │ Handler  │   │           │       │       │
│  └──────────┘   └──────────┘   └──────────┘       │       │
│                                                    │       │
│  ┌─────────────────────────────────────────────────┴────┐  │
│  │  Prisma Query Engine                                │  │
│  │  Connection pooling, migration, query building       │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │ TCP :5432
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   DATABASE (Neon Cloud)                       │
│                                                              │
│  PostgreSQL 16 — Serverless, auto-scaling                    │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  users   │  │customers │  │ products │  │sales_    │    │
│  │          │  │          │  │          │  │challans  │    │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤    │
│  │id (PK)   │  │id (PK)   │  │id (PK)   │  │id (PK)   │    │
│  │name      │  │name      │  │name      │  │challan_  │    │
│  │email (UQ)│  │mobile    │  │sku (UQ)  │  │number(UQ)│    │
│  │password  │  │email     │  │category  │  │customerId│    │
│  │hash      │  │business  │  │unitPrice │  │totalQty  │    │
│  │role      │  │name      │  │current   │  │status    │    │
│  │          │  │gstNumber │  │Stock     │  │createdBy │    │
│  │          │  │type      │  │minStock  │  │          │    │
│  │          │  │status    │  │AlertQty  │  ├──────────┤    │
│  │          │  │address   │  │location  │  │challan_  │    │
│  │          │  │followUp  │  │imageUrl  │  │items     │    │
│  │          │  │Date      │  │          │  │(child)   │    │
│  │          │  │notes     │  ├──────────┤  └──────────┘    │
│  │          │  │          │  │stock_    │                   │
│  │          │  ├──────────┤  │movements │                   │
│  │          │  │follow_ups│  │(child)   │                   │
│  │          │  │(child)   │  └──────────┘                   │
│  └──────────┘  └──────────┘                                 │
└──────────────────────────────────────────────────────────────┘
```

### Request Lifecycle (Example: Creating a Sales Challan)

```
1. User fills challan form → clicks "Save & Confirm"
2. React → api.post('/challans', { customerId, lines, status: 'CONFIRMED' })
3. Axios interceptor → adds Authorization: Bearer <token>
4. Express routes → /challans → authenticate() middleware
5. authenticate() → verifies JWT signature, decodes payload → req.user = { id, role, name }
6. authorize('ADMIN','SALES') → checks req.user.role, 403 if unauthorized
7. validate() → express-validator checks required fields, formats
8. createChallan() controller:
   a. Prisma.$transaction([...]):
      - Generate challan number: CH-2026-0001 (auto-increment per year)
      - For each product line:
        * Query current stock
        * If CONFIRMED: check stock ≥ quantity, reject with 400 if insufficient
        * If CONFIRMED: UPDATE product SET currentStock = currentStock - quantity
        * INSERT challan_item with snapshot (productNameSnap, productSkuSnap, unitPriceSnap)
      - INSERT sales_challan with status
   b. Commit transaction (rolls back everything on any failure)
   c. Return 201 + full challan with items
9. errorHandler() → catches any thrown ApiError or Prisma error → JSON error response
```

---

## 📦 Core Modules

### Module 1: Authentication & Role-Based Access

**Endpoints:**
- `POST /auth/login` — Authenticate and receive JWT token
- `POST /auth/register` — (Admin only) Create new users
- `GET /auth/me` — Get current authenticated user

**Roles:**

| Role | Abilities |
|---|---|
| **ADMIN** | Full access to every module and action |
| **SALES** | Create/edit customers & challans. Read-only products. |
| **WAREHOUSE** | Create/edit products & manage stock. Read-only customers/challans. |
| **ACCOUNTS** | Read-only access across all modules. |

**Security implementation:**
- Passwords hashed with bcryptjs (12 salt rounds)
- JWT tokens signed with HS256, configurable secret via `JWT_SECRET`
- Token expiry: 24 hours
- `authenticate()` middleware decodes JWT and attaches `req.user`
- `authorize(...roles)` middleware checks `req.user.role` against allowed roles
- Frontend auto-redirects to `/login` on 401 response via Axios interceptor
- Frontend `ProtectedRoute` component blocks unauthorized page access

---

### Module 2: Customer CRM

**Customer fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | ✅ | Customer/contact name |
| `mobile` | String | ✅ | Phone number |
| `email` | String | ❌ | Email address |
| `businessName` | String | ❌ | Company/business name |
| `gstNumber` | String | ❌ | GST registration (India) |
| `customerType` | Enum | ✅ | `RETAIL`, `WHOLESALE`, or `DISTRIBUTOR` |
| `address` | Text | ❌ | Full address |
| `status` | Enum | ✅ | `LEAD`, `ACTIVE`, or `INACTIVE` |
| `followUpDate` | Date | ❌ | Next follow-up date |
| `notes` | Text | ❌ | General notes |

**Features:**
- ✅ **Add customer** — Create new customer record
- ✅ **Edit customer** — Update any customer field
- ✅ **Search customers** — Search by name, mobile, email, or business name
- ✅ **Filter customers** — Filter by status (Lead/Active/Inactive)
- ✅ **Customer detail page** — Full customer info with follow-up history
- ✅ **Follow-up notes** — Add timestamped notes with author tracking

**Follow-up history:**
Each follow-up record stores:
- Note text
- Follow-up date (optional)
- Author (name + user ID)
- Timestamp

---

### Module 3: Product & Inventory Management

**Product fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | ✅ | Product name |
| `sku` | String | ✅ | Stock Keeping Unit (unique) |
| `category` | String | ❌ | Product category |
| `unitPrice` | Decimal | ✅ | Price per unit (₹) |
| `currentStock` | Integer | ✅ | Current inventory count |
| `minStockAlertQty` | Integer | ✅ | Low-stock threshold |
| `location` | String | ❌ | Warehouse location |
| `imageUrl` | String | ❌ | Product image path |

**Features:**
- ✅ **Add product** — Create new product with optional opening stock
- ✅ **Edit product** — Update product details (stock adjusted separately)
- ✅ **Search products** — Search by name or SKU
- ✅ **Filter by category** — Filter products by category
- ✅ **Low-stock filter** — Show only products where `currentStock ≤ minStockAlertQty`
- ✅ **Stock movement log** — Full audit trail for every stock change
- ✅ **Image upload** — Upload product image (JPG, PNG, WebP, GIF; max 5MB)

**Stock Movement Log:**

Each movement records:
| Field | Description |
|---|---|
| `productId` | Related product |
| `quantity` | Quantity changed |
| `movementType` | `IN` (restock) or `OUT` (removal) |
| `reason` | Free-text reason (e.g., "Restock from supplier", "Damaged goods") |
| `createdBy` | User who made the change |
| `createdAt` | Timestamp |

---

### Module 4: Sales Challan

**Challan fields:**

| Field | Type | Notes |
|---|---|---|
| `challanNumber` | String | Auto-generated: `CH-YYYY-NNNN` |
| `customerId` | UUID | Linked customer |
| `totalQuantity` | Integer | Sum of all line items |
| `status` | Enum | `DRAFT`, `CONFIRMED`, or `CANCELLED` |
| `createdBy` | UUID | User who created the challan |
| `confirmedAt` | DateTime | When challan was confirmed |
| `cancelledAt` | DateTime | When challan was cancelled |

**Challan Line Items (product snapshot):**

Each line stores a **snapshot** of the product at time of sale:

| Field | Source |
|---|---|
| `productId` | Live product reference |
| `productNameSnap` | Product name at time of challan creation |
| `productSkuSnap` | Product SKU at time of challan creation |
| `unitPriceSnap` | Product price at time of challan creation |
| `quantity` | Quantity ordered |
| `lineTotal` | `unitPriceSnap × quantity` |

This ensures **historical challans remain accurate** even if a product is later renamed, repriced, or deleted.

**Stock Control Logic:**

```
IF status = 'CONFIRMED':
  FOR EACH line in challan:
    IF product.currentStock < line.quantity:
      RETURN 400 "Insufficient stock"
    product.currentStock -= line.quantity
  COMMIT transaction
  
IF challan is cancelled AND was CONFIRMED:
  FOR EACH line in challan:
    product.currentStock += line.quantity
  UPDATE status = 'CANCELLED'
```

**Status Flow:**
```
DRAFT ──▶ CONFIRMED ──▶ CANCELLED
               │              ▲
               └───── only if ─┘
                     was CONFIRMED
```

---

## 🏆 Bonus Features

### ✅ Feature 1: PDF Invoice Export

**Endpoint:** `GET /challans/:id/invoice`

Each confirmed challan has a **"Download Invoice (PDF)"** button on its detail page.

**Invoice contents:**
- Company header: **Orbital Ops Portal**
- Invoice title with challan number
- Customer name and contact information
- Line-item table with:
  - Product name, SKU
  - Quantity
  - Unit price
  - Line total
- Grand total (sum of all line totals)
- Generated date

**Technical implementation:**
- Backend generates PDF using `pdfkit` library
- PDF is streamed directly to response with `Content-Type: application/pdf`
- Frontend downloads via authenticated Axios request with `responseType: 'blob'`
- File is saved as `Challan-{number}.pdf`

### ✅ Feature 2: GitHub Actions CI/CD

**File:** `.github/workflows/ci.yml`

Triggers on every **push** and **pull request** to the `master` branch.

**Pipeline steps:**
1. **Checkout** — Clone repository
2. **Setup Node.js** — v20 with npm caching
3. **Install dependencies** — Backend + frontend
4. **Prisma generate** — Generate Prisma client
5. **TypeScript typecheck** — `tsc --noEmit` for both backend and frontend
6. **Frontend build** — `vite build` to verify production build succeeds

### ✅ Feature 3: Product Image Upload

**Endpoint:** `POST /products/:id/upload-image`

Admin and Warehouse users can upload product images.

**Technical implementation:**
- Upload via `multer` middleware (multipart/form-data)
- Supported formats: JPG, JPEG, PNG, WebP, GIF
- Maximum file size: 5MB
- Images stored locally in `backend/uploads/` directory
- Filename format: `product-{timestamp}.{ext}`
- Served via dedicated API endpoint: `GET /products/:id/image`
- Endpoint sets proper cross-origin headers for cross-domain loading
- Displayed on product detail page

**Note for production:** The local filesystem storage works for development and demo. For production, swap the multer storage engine to S3/Cloudinary. The controller code is structured for easy replacement.

---

## 📡 API Documentation

### Authentication

All endpoints except those marked **Public** require:
```
Authorization: Bearer <jwt_token>
```

#### `POST /auth/login` — Public
Authenticate and receive a JWT token.

**Request:**
```json
{
  "email": "admin@erp.com",
  "password": "Password@123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@erp.com",
    "role": "ADMIN"
  }
}
```

**Error (401):**
```json
{ "error": "Invalid email or password" }
```

#### `POST /auth/register` — Admin only
Create a new user.

**Request:**
```json
{
  "email": "newuser@erp.com",
  "password": "SecurePass123!",
  "name": "New User",
  "role": "SALES"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "New User",
  "email": "newuser@erp.com",
  "role": "SALES"
}
```

#### `GET /auth/me`
Returns the currently authenticated user.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Admin User",
  "email": "admin@erp.com",
  "role": "ADMIN"
}
```

---

### Customers

#### `GET /customers` — Any authenticated role
List customers with pagination, search, and status filter.

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Search name, mobile, email, or business name |
| `status` | string | — | Filter: `LEAD`, `ACTIVE`, `INACTIVE` |
| `page` | integer | 1 | Page number |
| `pageSize` | integer | 20 | Items per page (max 100) |

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "mobile": "9876543210",
      "email": "contact@acme.com",
      "businessName": "Acme Wholesale",
      "gstNumber": "27AAECS1234F1Z5",
      "customerType": "WHOLESALE",
      "address": "123 Industrial Area, Mumbai",
      "status": "ACTIVE",
      "followUpDate": "2026-08-15T00:00:00.000Z",
      "notes": "Key account, call monthly",
      "createdAt": "2026-07-29T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### `POST /customers` — Admin, Sales
Create a new customer.

**Request:**
```json
{
  "name": "Acme Corp",
  "mobile": "9876543210",
  "email": "contact@acme.com",
  "businessName": "Acme Wholesale",
  "gstNumber": "27AAECS1234F1Z5",
  "customerType": "WHOLESALE",
  "address": "123 Industrial Area, Mumbai",
  "status": "ACTIVE",
  "followUpDate": "2026-08-15",
  "notes": "Key account"
}
```

**Response (201):** Created customer object.

#### `GET /customers/:id`
Get a single customer with follow-up history.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Acme Corp",
  "...": "...",
  "followUps": [
    {
      "id": "uuid",
      "note": "Discussed new pricing",
      "followUpDate": null,
      "createdBy": { "name": "Sales User" },
      "createdAt": "2026-07-29T11:00:00.000Z"
    }
  ]
}
```

#### `PUT /customers/:id` — Admin, Sales
Update customer fields.

**Request:** Same fields as POST (all optional except `name` and `mobile`).

**Response (200):** Updated customer object.

#### `POST /customers/:id/follow-ups` — Admin, Sales
Add a follow-up note.

**Request:**
```json
{
  "notes": "Discussed new pricing model",
  "followUpDate": "2026-08-15"
}
```

**Response (201):** Created follow-up record.

---

### Products

#### `GET /products`
List products with pagination, search, and filters.

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `search` | string | — | Search name or SKU |
| `category` | string | — | Filter by category |
| `lowStock` | boolean | — | If `true`, show only products with `currentStock ≤ minStockAlertQty` |
| `page` | integer | 1 | Page number |
| `pageSize` | integer | 20 | Items per page (max 100) |

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Steel Rod 12mm",
      "sku": "SR-12MM-001",
      "category": "Steel",
      "unitPrice": 850.00,
      "currentStock": 45,
      "minStockAlertQty": 20,
      "location": "Warehouse A - Rack 1",
      "imageUrl": "/uploads/product-123456789.png"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 10, "totalPages": 1 }
}
```

#### `POST /products` — Admin, Warehouse
Create a new product. If `currentStock > 0`, an initial `IN` stock movement is logged.

**Request:**
```json
{
  "name": "Steel Rod 12mm",
  "sku": "SR-12MM-001",
  "category": "Steel",
  "unitPrice": 850.00,
  "currentStock": 100,
  "minStockAlertQty": 20,
  "location": "Warehouse A - Rack 1"
}
```

**Response (201):** Created product object.

#### `GET /products/:id`
Get product details with stock movement history.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Steel Rod 12mm",
  "...": "...",
  "stockMovements": [
    {
      "id": "uuid",
      "quantity": 50,
      "movementType": "OUT",
      "reason": "Challan CH-2026-0001",
      "createdBy": { "name": "Sales User" },
      "createdAt": "2026-07-29T12:00:00.000Z"
    }
  ]
}
```

#### `PUT /products/:id` — Admin, Warehouse
Update product details. Note: stock is adjusted separately via stock-movements endpoint.

**Request:** Same fields as POST (except `currentStock` — use stock-movements endpoint).

#### `POST /products/:id/stock-movements` — Admin, Warehouse
Record a stock adjustment.

**Request:**
```json
{
  "quantity": 50,
  "movementType": "IN",
  "reason": "Restock from supplier"
}
```

| Field | Validation |
|---|---|
| `quantity` | Must be positive integer |
| `movementType` | Must be `IN` or `OUT` |
| `reason` | Required, non-empty |

**Error (400) — Insufficient stock:**
```json
{ "error": "Insufficient stock. Available: 10, requested: 50" }
```

#### `POST /products/:id/upload-image` — Admin, Warehouse
Upload a product image.

**Request:** `multipart/form-data`
- Field name: `image`
- Accepted types: JPG, JPEG, PNG, WebP, GIF
- Max size: 5MB

**Response (200):**
```json
{ "imageUrl": "/uploads/product-123456789.png" }
```

#### `GET /products/:id/image` — Public
Serves the product image file with proper cross-origin headers.

**Response (200):** Image file (Content-Type: image/png, etc.)

---

### Sales Challans

#### `GET /challans`
List challans with pagination and filters.

**Query parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter: `DRAFT`, `CONFIRMED`, `CANCELLED` |
| `customerId` | string | — | Filter by customer |
| `page` | integer | 1 | Page number |
| `pageSize` | integer | 20 | Items per page (max 100) |

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "challanNumber": "CH-2026-0001",
      "customer": { "id": "uuid", "name": "Acme Corp" },
      "totalQuantity": 150,
      "status": "CONFIRMED",
      "createdBy": { "name": "Sales User" },
      "createdAt": "2026-07-29T12:00:00.000Z",
      "confirmedAt": "2026-07-29T12:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 3, "totalPages": 1 }
}
```

#### `POST /challans` — Admin, Sales
Create a new challan.

**Request:**
```json
{
  "customerId": "uuid",
  "status": "CONFIRMED",
  "lines": [
    { "productId": "uuid", "quantity": 50 },
    { "productId": "uuid", "quantity": 100 }
  ]
}
```

| Field | Validation |
|---|---|
| `customerId` | Must be valid UUID |
| `status` | Must be `DRAFT` or `CONFIRMED` |
| `lines` | Array, minimum 1 item |
| `lines[].productId` | Must be valid UUID |
| `lines[].quantity` | Must be positive integer |

**Business logic:**
- If status is `CONFIRMED`, stock is checked and reduced atomically
- All operations inside a database transaction
- If any product has insufficient stock, the entire request is rejected

**Error (400) — Insufficient stock:**
```json
{ "error": "Insufficient stock for product Steel Rod 12mm. Available: 10, requested: 50" }
```

#### `GET /challans/:id`
Get challan details with all line items. Includes product snapshots.

**Response (200):**
```json
{
  "id": "uuid",
  "challanNumber": "CH-2026-0001",
  "customer": { "id": "uuid", "name": "Acme Corp" },
  "totalQuantity": 150,
  "status": "CONFIRMED",
  "createdBy": { "name": "Sales User" },
  "createdAt": "2026-07-29T12:00:00.000Z",
  "confirmedAt": "2026-07-29T12:00:00.000Z",
  "items": [
    {
      "productNameSnap": "Steel Rod 12mm",
      "productSkuSnap": "SR-12MM-001",
      "unitPriceSnap": 850.00,
      "quantity": 50,
      "lineTotal": 42500.00
    }
  ]
}
```

#### `POST /challans/:id/confirm` — Admin, Sales
Confirm a draft challan. Reduces stock atomically.

**Business logic:**
- Only `DRAFT` challans can be confirmed
- Checks stock availability for all lines
- Reduces stock inside a transaction
- Sets `confirmedAt` timestamp
- If any stock is insufficient, returns 400 error

**Error (400) — Already confirmed:**
```json
{ "error": "Challan is already confirmed" }
```

#### `POST /challans/:id/cancel` — Admin, Sales
Cancel a confirmed challan. Restores stock.

**Business logic:**
- Only `CONFIRMED` challans can be cancelled
- Restores all deducted stock quantities
- Sets `cancelledAt` timestamp
- Stock restoration happens inside a transaction

**Error (400) — Wrong status:**
```json
{ "error": "Only confirmed challans can be cancelled" }
```

#### `GET /challans/:id/invoice`
Download a professional PDF invoice for a confirmed challan.

**Response (200):** `application/pdf` — binary PDF file

**Error (400):**
```json
{ "error": "Invoice is only available for confirmed challans" }
```

---

## 🗄️ Database Schema

The database consists of **7 tables** with the following relationships:

```
users ──────────┐
├── has many ── follow_ups (via createdById)
├── has many ── stock_movements (via createdById)
└── has many ── sales_challans (via createdById)

customers ──────┐
├── has many ── follow_ups (via customerId)
└── has many ── sales_challans (via customerId)

products ───────┐
├── has many ── stock_movements (via productId)
└── has many ── challan_items (via productId)

sales_challans ─┐
└── has many ── challan_items (via challanId, cascade delete)
```

### Key Design Decisions

1. **Product snapshots** — `ChallanItem` stores `productNameSnap`, `productSkuSnap`, `unitPriceSnap` independent of the live `Product` record, ensuring historical challans stay accurate.

2. **Follow-up history** — `FollowUp` is a separate table (not a field on `Customer`), allowing multiple follow-ups per customer with full audit trail (author + timestamp).

3. **Stock movement audit** — Every stock change creates a `StockMovement` record, providing a complete audit trail for inventory changes.

4. **Decimal precision** — All monetary values use `@db.Decimal(12, 2)` for exact currency representation (avoids floating-point rounding errors).

---

## 🔑 Login Credentials

**Password for all accounts:** `Password@123`

| Role | Email | Can Do |
|---|---|---|
| **Admin** | admin@erp.com | Everything — create/edit/delete all records, manage users |
| **Sales** | sales@erp.com | Manage customers & challans. View products (read-only). |
| **Warehouse** | warehouse@erp.com | Manage products & stock. View customers & challans (read-only). |
| **Accounts** | accounts@erp.com | View everything (read-only). No create/edit permissions. |

---

## 🖥️ Local Setup (without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (local or cloud)

### Step 1: Database
```bash
# Option A: Install PostgreSQL locally and create database
createdb erp_crm

# Option B: Use Neon cloud (free) — https://neon.tech
# Copy the connection string they provide
```

### Step 2: Backend
```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env — set your DATABASE_URL and JWT_SECRET
# DATABASE_URL=postgresql://user:password@localhost:5432/erp_crm
# JWT_SECRET=your-long-random-secret-key

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev --name init

# Seed sample data (4 users + sample products/customers)
npm run prisma:seed

# Start development server
npm run dev
```

Backend runs at **http://localhost:4000**

### Step 3: Frontend
```bash
cd frontend

# Copy environment file (VITE_API_URL defaults to http://localhost:4000)
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at **http://localhost:5173**

---

## 🐳 Local Setup (with Docker)

### Prerequisites
- Docker Desktop
- Docker Compose

### Quick Start
```bash
# Clone the repository
git clone https://github.com/Saqlain70/erp-crm-portal.git
cd erp-crm-portal

# Build and start all services
docker compose up --build
```

This starts three containers:
| Container | Image | Port | Description |
|---|---|---|---|
| `db` | postgres:16-alpine | 5432 | PostgreSQL database |
| `backend` | erp-crm-backend | 4000 | Express API |
| `frontend` | erp-crm-frontend | 5173 | Nginx + React SPA |

### Seed Data
```bash
# Run once after first startup
docker compose exec backend npm run prisma:seed
```

### Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/health

---

## 🚀 Deployment Guide

### Database — Neon (PostgreSQL)

1. Go to [https://console.neon.tech](https://console.neon.tech) and sign up
2. Click **"Create Project"** → Name: `erp-crm-db`
3. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`)
4. Keep this for later — it's your `DATABASE_URL`

### Backend — Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign up with GitHub
2. Click **"New +"** → **"Web Service"** → Connect your GitHub repo
3. Configure:
   - **Name:** `erp-crm-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Branch:** `master`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && node dist/index.js`
   - **Instance Type:** `Free`
4. Add environment variables:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = a random secret string (use a password generator)
   - `PORT` = `10000`
5. Click **"Create Web Service"**
6. Wait for build to complete (2-3 minutes)
7. Once deployed, seed the database from your local machine:
   ```bash
   cd backend
   npx prisma db seed
   ```
   (This connects to the Neon database using the same `DATABASE_URL`)

### Frontend — Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework:** `Vite`
5. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g., `https://erp-crm-backend.onrender.com`)
6. Click **"Deploy"**
7. Vercel provides a `vercel.json` file for SPA routing (all routes → `index.html`)

### Post-Deployment Verification

1. Visit your Vercel URL → should see login page
2. Login with `admin@erp.com` / `Password@123`
3. Dashboard should show stats
4. Navigate to Customers, Products, Challans — all should load data
5. Test creating a product, adjusting stock, creating a challan

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string (local or cloud) |
| `JWT_SECRET` | ✅ | — | Secret key for JWT signing (use a long random string) |
| `PORT` | ❌ | `4000` | API server port |

**Example:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/erp_crm
JWT_SECRET=my-super-secret-key-change-in-production-2026
PORT=4000
```

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | ❌ | `http://localhost:4000` | Backend API base URL |

**Example:**
```env
# Local development:
VITE_API_URL=http://localhost:4000

# Production (Vercel):
VITE_API_URL=https://erp-crm-backend-pggl.onrender.com
```

### Sample files included
- `backend/.env.example` — Template with placeholder values
- `frontend/.env.example` — Template with default values

---

## 🗄️ Project Structure

```
erp-crm/
│
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions — typecheck + build on push
│
├── backend/                          # Express.js + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema (7 models)
│   │   ├── seed.ts                   # Seed: 4 users, sample products/customers
│   │   └── migrations/               # Auto-generated migration files
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts     # Login, register, get current user
│   │   │   ├── customerController.ts # CRUD + follow-ups + search
│   │   │   ├── productController.ts  # CRUD + stock movements + image upload/serve
│   │   │   └── challanController.ts  # CRUD + confirm + cancel + PDF invoice
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT verification + role authorization
│   │   │   ├── validate.ts           # express-validator middleware
│   │   │   └── errorHandler.ts       # Global error handler + ApiError class
│   │   ├── routes/
│   │   │   ├── authRoutes.ts         # /auth routes
│   │   │   ├── customerRoutes.ts     # /customers routes
│   │   │   ├── productRoutes.ts      # /products routes
│   │   │   └── challanRoutes.ts      # /challans routes
│   │   ├── prisma/
│   │   │   └── client.ts             # Prisma singleton instance
│   │   ├── app.ts                    # Express app setup (middleware, routes, static)
│   │   └── index.ts                  # Server entry point
│   ├── uploads/                      # Product image storage (local)
│   ├── .env.example                  # Environment variable template
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                         # React + TypeScript SPA
│   ├── public/
│   │   ├── favicon.svg               # App icon
│   │   └── icons.svg                 # SVG icon sprite (sidebar navigation)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Login form with role-based demo credentials
│   │   │   ├── Dashboard.tsx         # Stats overview (customers, products, challans)
│   │   │   ├── CustomerList.tsx      # Searchable customer table
│   │   │   ├── CustomerDetail.tsx    # Customer info + follow-up history
│   │   │   ├── CustomerForm.tsx      # Add/edit customer form
│   │   │   ├── ProductList.tsx       # Searchable product table with low-stock filter
│   │   │   ├── ProductDetail.tsx     # Product info + stock movements + image upload
│   │   │   ├── ProductForm.tsx       # Add/edit product form
│   │   │   ├── ChallanList.tsx       # Challan table with status filter
│   │   │   ├── ChallanDetail.tsx     # Challan details + confirm/cancel/invoice actions
│   │   │   └── ChallanForm.tsx       # Create challan with product lines
│   │   ├── components/
│   │   │   ├── Layout.tsx            # Sidebar navigation + top bar
│   │   │   ├── ProtectedRoute.tsx    # Auth guard for routes
│   │   │   └── Badges.tsx            # Status badges (confirmed, draft, stock level)
│   │   ├── context/
│   │   │   └── AuthContext.tsx        # JWT session management (login, logout, user)
│   │   ├── api/
│   │   │   └── client.ts             # Axios instance with auth interceptor
│   │   ├── types.ts                  # TypeScript interfaces
│   │   ├── index.css                 # Global styles (admin theme)
│   │   ├── App.tsx                   # Root component with routes
│   │   └── main.tsx                  # Entry point
│   ├── vercel.json                   # SPA rewrite rules for Vercel
│   ├── .env.example                  # Environment variable template
│   ├── nginx.conf                    # Nginx config for Docker deployment
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── Dockerfile
│
├── docker-compose.yml                # Postgres + backend + frontend orchestration
├── postman_collection.json            # Complete API collection for testing
└── README.md                         # This file
```

---

## 🧠 Assumptions

1. **Warehouse location is free-text** — The `location` field on products is a string (e.g., "Warehouse A - Rack 1") rather than a separate `Warehouses` table. The case study didn't require multi-warehouse transfer logic or inventory by warehouse.

2. **Follow-ups are a history table** — `FollowUp` is a separate table linked to `Customer`, not a single overwritable field. This preserves multiple follow-ups with full audit trail (author + timestamp). The case study's "Add follow-up notes" feature implied more than one note per customer.

3. **Challans can be created as CONFIRMED directly** — Users can either save as `DRAFT` (no stock impact) or `CONFIRMED` (stock reduced immediately). Both paths share the same validation logic. This matches real-world workflows where some challans are final on creation.

4. **Role-based read access** — Warehouse and Accounts roles have read-only access to customers and challans (useful for their daily work) even though the brief only explicitly required write permissions for specific roles. Sales and Accounts have read-only access to products.

5. **Local filesystem for images** — Product images use multer's local disk storage. For production, swapping to S3/Cloudinary requires changing only the multer storage engine — the controller code is structured for easy replacement.

---

## ⚠️ Known Limitations

| Limitation | Impact | Workaround / Future Fix |
|---|---|---|
| **Ephemeral image storage on Render** | Render's free tier uses an ephemeral filesystem — uploaded images are lost on service restart/deploy. | For production, swap multer storage to S3, Cloudinary, or similar cloud storage. The controller is structured for easy swap. |
| **No automated test suite** | No unit or integration tests. | The codebase is structured with clear separation (routes → controllers → Prisma) making it straightforward to add tests. Jest + supertest recommended. |
| **Basic frontend pagination** | Uses a large page size (up to 100) rather than pagination controls. Acceptable for demo data (tens to hundreds of records). | Add page number buttons and page size selector to the table components. |
| **No multi-warehouse support** | Warehouse/location is a single text field. Can't track inventory across multiple locations. | Would require a `Warehouses` table and `warehouseId` on products/stock movements. |
| **No email notifications** | No automated emails for follow-up reminders or challan confirmations. | Integrate with a transactional email service (SendGrid, Resend, etc.). |
| **No separate audit log** | Stock movement log is the only audit trail. Customer/challan edits aren't tracked historically. | Implement a generic audit log table recording all `CREATE`/`UPDATE`/`DELETE` operations. |
| **No invoice PDF localization** | Invoice format is fixed (English, ₹ currency). | Add locale/currency configuration. |
| **Prisma binary download** | `npx prisma generate` downloads a native query engine at build time — requires internet access. | Pre-install or vendor the binary for fully offline CI/CD. |

---

## 📄 Postman Collection

A complete Postman collection is included at `postman_collection.json` in the repository root.

**How to use:**
1. Open Postman → **Import** → Select `postman_collection.json`
2. Create a new environment with variable `baseUrl`:
   - Local: `http://localhost:4000`
   - Production: `https://erp-crm-backend-pggl.onrender.com`
3. Run **"Login"** request first — it auto-saves the JWT token as a collection variable
4. All other requests will automatically use the saved token

---

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request to `master`:

```yaml
# Summary of pipeline steps:
1. Checkout repository
2. Setup Node.js 20 (with npm caching)
3. Install backend dependencies (npm ci)
4. Generate Prisma client
5. TypeScript typecheck backend (tsc --noEmit)
6. Install frontend dependencies (npm ci)
7. TypeScript typecheck frontend (tsc -b --noEmit)
8. Build frontend (vite build)
```

The pipeline ensures:
- No TypeScript errors on either backend or frontend
- Frontend builds successfully for production
- Dependencies are properly installed

---

> **Built by:** Saqlain  
> **Project:** Full Stack Developer Case Study — Mini ERP + CRM Operations Portal  
> **Date:** July 29, 2026
