# AgriHover – Complete Developer Brief for Backend & Database (agrihover.sql)

_Last updated: 2025-08-31_

---

## **1. Objective**
Build the backend for AgriHover using Node.js (or Django if preferred), PostgreSQL, and environment configuration from `.env`. The backend must handle multi-product quoting, invoicing, **client management with VAT details**, and user management.

The developer will also create the `agrihover.sql` file for initializing the database schema and apply migrations as needed. **All naming conventions must be consistent across the app: use `snake_case` for database fields and `camelCase` for variables and API responses.**

---

## **2. Tech Stack**
- **Backend**: Node.js with Express ()
- **Database**: PostgreSQL
- **ORM**: Prisma / Sequelize (or Django ORM if using Python)
- **Environment**: `.env` file for secrets (DB credentials, JWT secret, email config)

`.env` sample keys:

3. Create project .env (root of repo) for backend connectivity:
   - DB_HOST=localhost
   - DB_PORT=5432
   - DB_NAME=agrihover
   - DB_USER=postgres
   - DB_PASSWORD=agrihover123
4. Apply schema:
   - psql -h localhost -U postgres -d agrihover -f agrihover.sql
5. Verify:
   - \dt shows tables; select 1; confirms pgcrypto extension exists.

```

---

## **3. Database Schema Requirements**
The `agrihover.sql` file should:

- Enable `uuid-ossp` or `pgcrypto` for UUID generation.
- Use **snake_case** for all column names.
- Create the following tables:

### **Users**
- id (UUID, PK)
- name, email (unique), password_hash
- role: enum('admin','user')
- timestamps

### **Clients**
- id (UUID, PK)
- name, email, phone
- vat_number (string)
- address JSON (street, city, province, postal code)
- notes TEXT
- created_by (FK to users)
- timestamps

### **Settings**
- currency, language
- branding JSON (company name, contact info)
- payments JSON (banking details)

### **Products**
- id (UUID, PK)
- name, category (Spraying, Granular, Travelling, Imaging, Accommodation)
- pricing_type (tiered, flat, per_km)
- base_rate (for flat/per_km)
- discount_threshold (numeric)
- discount_rate (decimal, e.g., 0.15)
- sku (auto-generated string)

### **Product Tiers**
- product_id FK
- threshold, rate per tier

### **Quotes**
- id, quote_number (unique)
- user_id FK
- client_id FK
- status ('draft','sent')

### **Quote Items**
- quote_id FK
- product_id FK
- quantity
- calc JSON (applied tier, discount, subtotal)

### **Invoices**
- id, invoice_number
- quote_id FK
- issue_date, due_date
- status ('draft','sent','paid','overdue')
- banking JSON

---

## **4. Features to Implement**

### **4.1 Authentication & User Management**
- JWT-based login
- Role-based (admin vs user)

### **4.2 Client Management**
- Create, view, edit, delete clients
- Search/filter clients
- Add VAT number for clients
- Link clients to quotes and invoices

### **4.3 Admin Panel (Backend)**
- Manage products, tiers, and discount rules
- Manage company branding & banking details (settings)

### **4.4 Quote Management**
- Create, edit, delete quotes
- Add multiple products to a quote
- Attach quote to a client
- Calculate tiered pricing and discounts dynamically

### **4.5 Invoice Management**
- Convert quote → invoice
- Add due dates
- Pull banking details from settings
- Update status (draft, sent, paid, overdue)

### **4.6 PDF Generation (Backend)**
- Generate Quote & Invoice PDFs with full product breakdown and client VAT details

---

## **5. Discount System**
- Each product can define its **own discount threshold** and **discount rate**.
- Calculation: If quantity > threshold → apply discount on extra units.

---

## **6. Deliverables**
- `agrihover.sql` (full schema + default seed data)
- Node.js (or Django) backend with:
  - Authentication endpoints
  - Client management endpoints (with VAT support)
  - Product & tier CRUD endpoints
  - Quote & invoice endpoints
- Use `.env` for DB credentials, secrets, and SMTP settings
- Basic validation and error handling
- **Maintain naming conventions: snake_case for DB, camelCase for code and API responses**

---

## **7. Seed Data in SQL**
- Default settings: currency = ZAR, branding placeholder
- Default products:
  - Spraying (tiered, discount threshold 100, rate 0.15)
  - Granular (tiered, same discount)
  - Travelling (per_km, base_rate = 10.00)
  - Imaging (flat, base_rate = 100.00)

---

**End of full backend + DB brief (with Client Management, VAT details, and naming convention guidelines).**

3. Create project .env (root of repo) for backend connectivity:
   - DB_HOST=localhost
   - DB_PORT=5432
   - DB_NAME=agrihover
   - DB_USER=postgres
   - DB_PASSWORD=agrihover123
4. Apply schema:
   - psql -h localhost -U postgres -d agrihover -f agrihover.sql
5. Verify:
   - \dt shows tables; select 1; confirms pgcrypto extension exists.


