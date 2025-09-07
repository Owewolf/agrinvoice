# AgriInvoice - Agricultural Invoice & Quote Management System

## 🔒 Security Setup (IMPORTANT - READ FIRST)

### Initial Security Configuration

**CRITICAL:** Before running this application, you must configure environment variables:

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with secure values:**
   ```bash
   nano .env
   ```

3. **Replace ALL placeholder values:**
   - `DB_PASSWORD`: Use a strong, unique password (16+ characters)
   - `JWT_SECRET`: Generate a cryptographically secure secret (32+ characters)
   - Update database credentials as needed

4. **Generate a secure JWT secret:**
   ```bash
   # Option 1: Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Option 2: Using OpenSSL
   openssl rand -hex 32
   ```

### 🚨 Security Warnings

- **NEVER** commit `.env` files to version control
- Use different secrets for development, staging, and production
- Regularly rotate JWT secrets and database passwords
- Ensure PostgreSQL is properly secured with restricted access

## Technology Stack

This project is built with:

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express.js, PostgreSQL
- **Authentication:** JWT with bcrypt password hashing
- **Database:** PostgreSQL with UUID primary keys

All shadcn/ui components have been downloaded under `@/components/ui`.

## File Structure

- `index.html` - HTML entry point
- `vite.config.ts` - Vite configuration file
- `tailwind.config.js` - Tailwind CSS configuration file
- `package.json` - NPM dependencies and scripts
- `src/app.tsx` - Root component of the project
- `src/main.tsx` - Project entry point
- `src/index.css` - Existing CSS configuration

## Components

- All shadcn/ui components are pre-downloaded and available at `@/components/ui`

## Styling

- Add global styles to `src/index.css` or create new CSS files as needed
- Use Tailwind classes for styling components

## Development

- Import components from `@/components/ui` in your React components
- Customize the UI by modifying the Tailwind configuration

## Note

The `@/` path alias points to the `src/` directory

# Commands

## Frontend

**Install Dependencies**

```shell
pnpm i
```

**Start Preview**

```shell
pnpm run dev
```

**To build**

```shell
pnpm run build
```

## Database Setup

1. **Verify PostgreSQL Installation**

```shell
psql --version
```

2. **Set Up Database**

```shell
# Create the database (if not exists)
sudo -u postgres psql -c "CREATE DATABASE agrihover;"

# Enable the pgcrypto extension
sudo -u postgres psql -d agrihover -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Apply the database schema
sudo -u postgres psql -d agrihover -f agrihover.sql
```

3. **Configure Environment** Create a `.env` file in the project root with the following content:

```properties
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agrihover
DB_USER=postgres
DB_PASSWORD=agrihover123
```

## Database Verification

**Check Tables**

```shell
sudo -u postgres psql -d agrihover -c "\dt"
```

**Verify Initial Data**

```shell
# Check products
sudo -u postgres psql -d agrihover -c "SELECT name, category, pricing_type FROM products;"

# Check settings
sudo -u postgres psql -d agrihover -c "SELECT currency, branding->>'companyName' as company FROM settings;"
```

## Troubleshooting

If you encounter any issues:

1. **Reset Database**

```shell
sudo -u postgres psql -c "DROP DATABASE IF EXISTS agrihover;"
```

Then repeat the database setup steps.

2. **Check PostgreSQL Status**

```shell
sudo systemctl status postgresql
```

3. **View PostgreSQL Logs**

```shell
sudo tail -f /var/log/postgresql/postgresql-*.log
```
