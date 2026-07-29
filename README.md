# Mini ERP + CRM Operations Portal

A small internal ERP/CRM system for a wholesale/distribution company, covering customer
CRM, product & inventory management, and a sales challan workflow with stock control.

Built for the Full Stack Developer Case Study.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js, TypeScript, Express.js, Prisma ORM |
| Database | PostgreSQL |
| Frontend | React, TypeScript, Vite, React Router |
| Auth | JWT, role-based access (Admin / Sales / Warehouse / Accounts) |
| Deployment | Docker Compose (local) or any Render/Railway/Vercel/Supabase-style free hosting |

## Project structure

```
erp-crm/
├── backend/            Express + TypeScript API, Prisma schema & migrations
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts     Seeds 4 role accounts + sample customers/products
│   └── src/
│       ├── controllers/
│       ├── middleware/  (JWT auth, role guard, validation, error handling)
│       ├── routes/
│       └── index.ts
├── frontend/           React + TypeScript admin UI (Vite)
│   └── src/
│       ├── pages/       Login, Dashboard, Customers, Products, Challans
│       ├── components/  Layout, ProtectedRoute, Badges
│       └── context/     AuthContext (JWT session)
├── docker-compose.yml   Postgres + backend + frontend, one command to run everything
└── postman_collection.json
```

## Core modules implemented

1. **Auth & Roles** — JWT login, 4 roles enforced at the route level (e.g. only
   Admin/Sales can create customers or challans; only Admin/Warehouse can edit products
   or adjust stock).
2. **Customer CRM** — add/edit/search customers, customer detail page, follow-up notes
   with timestamps and author.
3. **Product & Inventory** — add/edit products, stock movement log (IN/OUT, reason,
   who, when), low-stock flagging against a per-product minimum.
4. **Sales Challans** — select customer, add multiple product lines, auto-generated
   challan number (`CH-YYYY-0001`), Draft → Confirmed → Cancelled flow. Confirming a
   challan reduces stock atomically inside a DB transaction and **rejects the request
   if stock would go negative**. Each challan line stores a **snapshot** of the
   product's name/SKU/price at the time of sale, independent of the live product
   record, so historical challans stay accurate even if a product is later renamed
   or repriced. Cancelling a confirmed challan restores stock.

## Local setup (no Docker)

### 1. Database
Install PostgreSQL locally, or use a free hosted instance (Supabase, Neon, Render
Postgres — see "Deployment" below). Create a database, e.g. `erp_crm`.

### 2. Backend
```bash
cd backend
cp .env.example .env
# edit .env: set DATABASE_URL to your Postgres connection string, set JWT_SECRET

npm install
npx prisma migrate dev --name init   # creates tables
npm run prisma:seed                  # creates 4 role accounts + sample data
npm run dev                          # starts API on http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:4000 (default is fine locally)
npm install
npm run dev              # starts UI on http://localhost:5173
```

Open http://localhost:5173 and log in with any of the seeded accounts below.

## Local setup with Docker (recommended — one command)

```bash
docker compose up --build
```

This starts Postgres, runs backend migrations automatically on boot, and serves the
frontend via Nginx.

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

Seed data is **not** run automatically on Docker boot (to avoid re-seeding on every
restart). Run it once after the first `up`:
```bash
docker compose exec backend npm run prisma:seed
```

## Test login credentials

Password for all accounts: `Password@123`

| Role | Email |
|---|---|
| Admin | admin@erp.com |
| Sales | sales@erp.com |
| Warehouse | warehouse@erp.com |
| Accounts | accounts@erp.com |

## Environment variables

**backend/.env**
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs — use a long random string in production |
| `PORT` | API port (default 4000) |

**frontend/.env**
| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

## API overview

All endpoints except `/auth/login` and `/health` require `Authorization: Bearer <token>`.

```
POST   /auth/login
POST   /auth/register          (Admin only)
GET    /auth/me

GET    /customers               ?search=&status=&page=&pageSize=
POST   /customers               (Admin, Sales)
GET    /customers/:id
PUT    /customers/:id           (Admin, Sales)
POST   /customers/:id/follow-ups (Admin, Sales)

GET    /products                ?search=&lowStock=&page=&pageSize=
POST   /products                (Admin, Warehouse)
GET    /products/:id
PUT    /products/:id            (Admin, Warehouse)
POST   /products/:id/stock-movements (Admin, Warehouse)

GET    /challans                ?status=&customerId=&page=&pageSize=
POST   /challans                (Admin, Sales) — create as Draft or Confirmed
GET    /challans/:id
POST   /challans/:id/confirm    (Admin, Sales) — reduces stock, rejects if insufficient
POST   /challans/:id/cancel     (Admin, Sales) — restores stock if was Confirmed
```

A full Postman collection is included at `postman_collection.json` — import it, set
`baseUrl` to your API URL, run "Login" first (it auto-saves the token), then run any
other request.

## Deployment (free hosting)

The app deploys cleanly to free-tier hosting without AWS:
- **Database**: Supabase, Neon, or Render Postgres — copy the connection string into
  `DATABASE_URL`.
- **Backend**: Render or Railway. Set the build command to
  `npm install && npx prisma generate && npm run build`, start command to
  `npx prisma migrate deploy && npm start`, and set `DATABASE_URL`/`JWT_SECRET` as
  environment variables in the dashboard.
- **Frontend**: Vercel, Netlify, or Render Static Site. Set `VITE_API_URL` to the
  deployed backend URL as a build-time environment variable.

AWS deployment (e.g. EC2 + RDS behind Nginx, or ECS with the provided Dockerfiles) is
supported as a bonus path since the app is fully containerized, but isn't required to
run the app.

## Assumptions made

- "Warehouse/location" on a product is a free-text field rather than a separate
  warehouses table, since the brief didn't require multi-warehouse transfer logic.
- Follow-up notes are stored as their own history table (not just overwriting a single
  `notes` field), so multiple follow-ups per customer are preserved with author and
  timestamp — the brief's "Add follow-up notes" feature implied more than one note.
- A challan can be created directly as `CONFIRMED` (stock reduced immediately) as well
  as saved as `DRAFT` and confirmed later — both are common real-world flows and the
  same stock-validation logic guards both paths.
- Roles are enforced per-route rather than per-field: Warehouse/Accounts have read
  access to customers and challans (useful for their jobs) but cannot create/edit them;
  Sales/Accounts have read access to products but cannot edit stock.

## Known limitations / not implemented

- No invoice generation / PDF export (listed as a bonus feature in the brief).
- No AWS S3 product image upload (bonus feature).
- No GitHub Actions CI/CD pipeline is included (bonus feature) — Dockerfiles are
  provided so one can be added easily.
- Pagination on the frontend loads a large page size (up to 50–200 records) rather
  than implementing infinite scroll/pager controls — acceptable for the scale of a
  demo dataset, but a real deployment with thousands of records would want UI paging.
- No automated test suite (unit/integration tests) — out of scope given the time box,
  but the backend's layered structure (routes → validation → controllers → Prisma)
  is written to be testable with minimal changes.
- This backend's `npx prisma generate` step downloads a native query-engine binary at
  install/build time, which needs normal internet access; it is not runnable in fully
  network-isolated CI without vendoring that binary.
