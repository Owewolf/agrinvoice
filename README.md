# Shadcn-UI Template Usage Instructions

## Technology Stack

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- PostgreSQL (Database)

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
