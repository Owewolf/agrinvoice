-- AgriHover Database Schema
-- Last updated: 2025-09-17
-- Complete production schema with all features and relationships
-- All migrations have been incorporated into this file
--
-- DATABASE CONFIGURATION:
-- Database Name: agrihover (as per .env file)
-- PostgreSQL Version: 12+
-- Required Extensions: pgcrypto
--
-- MIGRATION HISTORY INCORPORATED:
-- - add_categories_table.sql: Added services table with UUID references 
-- - add_unit_to_categories.sql: Added unit field to services table
-- - add_website_to_branding.sql: Added website field to branding JSON
-- - rename_categories_to_services.sql: Renamed categories to services table
-- - add_costs_tables.sql: Added product_costs, overhead_costs tables
-- - add_quote_cost_tracking.sql: Added quote_costs and quote_profit_summary tables
-- - make_cost_category_optional.sql: Made cost_category optional in product_costs
-- - update_overhead_costs_structure.sql: Updated overhead_costs table structure
-- - update_product_costs_structure.sql: Updated product_costs table structure
-- - Currency changed from 'ZAR' to 'R' throughout application
--
-- *** THIS FILE IS THE SINGLE SOURCE OF TRUTH FOR THE DATABASE SCHEMA ***
-- All migrations have been consolidated into this file. 
-- The migrations/ directory has been removed.
-- No additional migration files are needed.

-- Enable UUID generation and password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    currency VARCHAR(10) DEFAULT 'R',
    language VARCHAR(10) DEFAULT 'en',
    branding JSONB,
    payments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    vat_number VARCHAR(255),
    address TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services Table (formerly categories)
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    unit VARCHAR(50) NOT NULL DEFAULT 'unit',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Product Costs Table - Specific costs per product with full migration support
CREATE TABLE product_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    cost_category VARCHAR(100), -- Made optional - legacy field for backward compatibility
    cost_name VARCHAR(255) NOT NULL,
    cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(50) NOT NULL DEFAULT 'unit',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    -- Legacy fields for backward compatibility
    supplier_cost NUMERIC(10,2), -- Optional supplier cost
    markup_percentage NUMERIC(5,2), -- Optional markup percentage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Overhead Costs Table - General business overhead with migration support
CREATE TABLE overhead_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_name VARCHAR(255) NOT NULL,
    cost_type VARCHAR(50) NOT NULL CHECK (cost_type IN ('fixed_amount', 'percentage')),
    cost_value NUMERIC(10, 4) NOT NULL, -- percentage (0.15 = 15%) or fixed amount
    applies_to VARCHAR(50) DEFAULT 'all' CHECK (applies_to IN ('all', 'revenue', 'direct_costs')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    -- Legacy fields for backward compatibility during transition
    category VARCHAR(100), -- Legacy category field
    monthly_amount NUMERIC(10,2), -- Legacy fixed monthly amount
    percentage_rate NUMERIC(5,2), -- Legacy percentage rate for variable costs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote Cost Tracking Tables
CREATE TABLE quote_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    quote_item_id UUID NOT NULL REFERENCES quote_items(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Cost breakdown
    quantity NUMERIC(8,2) NOT NULL,
    
    -- Product costs (per unit)
    fuel_cost_per_unit NUMERIC(10,4) DEFAULT 0,
    chemical_cost_per_unit NUMERIC(10,4) DEFAULT 0,
    equipment_cost_per_unit NUMERIC(10,4) DEFAULT 0,
    labor_cost_per_unit NUMERIC(10,4) DEFAULT 0,
    accommodation_cost_per_unit NUMERIC(10,4) DEFAULT 0,
    other_cost_per_unit NUMERIC(10,4) DEFAULT 0,
    
    -- Total costs (quantity * cost_per_unit)
    total_fuel_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * fuel_cost_per_unit) STORED,
    total_chemical_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * chemical_cost_per_unit) STORED,
    total_equipment_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * equipment_cost_per_unit) STORED,
    total_labor_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * labor_cost_per_unit) STORED,
    total_accommodation_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * accommodation_cost_per_unit) STORED,
    total_other_cost NUMERIC(10,2) GENERATED ALWAYS AS (quantity * other_cost_per_unit) STORED,
    
    -- Total direct cost for this line item
    total_direct_cost NUMERIC(10,2) GENERATED ALWAYS AS (
        (quantity * fuel_cost_per_unit) + 
        (quantity * chemical_cost_per_unit) + 
        (quantity * equipment_cost_per_unit) + 
        (quantity * labor_cost_per_unit) + 
        (quantity * accommodation_cost_per_unit) + 
        (quantity * other_cost_per_unit)
    ) STORED,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote Profit Summary Table
CREATE TABLE quote_profit_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    
    -- Revenue
    total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- Direct costs
    total_direct_costs NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- Overhead costs (calculated from overhead_costs table)
    total_overhead_costs NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- Profit calculations
    gross_profit NUMERIC(10,2) GENERATED ALWAYS AS (total_revenue - total_direct_costs) STORED,
    net_profit NUMERIC(10,2) GENERATED ALWAYS AS (total_revenue - total_direct_costs - total_overhead_costs) STORED,
    profit_margin NUMERIC(5,4) GENERATED ALWAYS AS (
        CASE 
            WHEN total_revenue > 0 THEN ((total_revenue - total_direct_costs - total_overhead_costs) / total_revenue)
            ELSE 0
        END
    ) STORED,
    
    -- Status tracking
    is_invoiced BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    service_id UUID REFERENCES services(id) NOT NULL,
    pricing_type VARCHAR(50) CHECK (pricing_type IN ('tiered', 'flat', 'per_km')),
    base_rate NUMERIC(10, 2),
    discount_threshold NUMERIC(8, 2),
    discount_rate NUMERIC(5, 4),
    sku VARCHAR(100) UNIQUE NOT NULL,
    unit VARCHAR(20) DEFAULT 'unit',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Tiers Table
CREATE TABLE product_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    threshold INTEGER NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes Table
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    status VARCHAR(50) CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')) DEFAULT 'draft',
    subtotal NUMERIC(10, 2) DEFAULT 0,
    total_discount NUMERIC(10, 2) DEFAULT 0,
    total_charge NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quote Items Table
CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity NUMERIC(8, 2) NOT NULL,
    speed NUMERIC(5, 2),           -- Operating speed (km/h or mph)
    flow_rate NUMERIC(5, 2),       -- Flow rate (L/min or gal/min)
    spray_width NUMERIC(5, 2),     -- Spray width (meters or feet)
    app_rate NUMERIC(8, 2),        -- Application rate (calculated L/ha or gal/acre)
    calculation JSONB,             -- Stores calculation details (rates, discounts, totals)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    quote_id UUID REFERENCES quotes(id),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) CHECK (status IN ('draft', 'sent', 'paid', 'overdue')) DEFAULT 'draft',
    banking JSONB,
    subtotal NUMERIC(10, 2) DEFAULT 0,
    total_discount NUMERIC(10, 2) DEFAULT 0,
    total_charge NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Files Table (for PDF storage and logos)
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id)
);

-- Automatic timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_costs_updated_at BEFORE UPDATE ON product_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_overhead_costs_updated_at BEFORE UPDATE ON overhead_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quote_costs_updated_at BEFORE UPDATE ON quote_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quote_profit_summary_updated_at BEFORE UPDATE ON quote_profit_summary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_tiers_updated_at BEFORE UPDATE ON product_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quote_items_updated_at BEFORE UPDATE ON quote_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance optimization indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_created_by ON clients(created_by);
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_product_costs_product_id ON product_costs(product_id);
CREATE INDEX idx_product_costs_cost_category ON product_costs(cost_category);
CREATE INDEX idx_product_costs_is_active ON product_costs(is_active);
CREATE INDEX idx_overhead_costs_cost_name ON overhead_costs(cost_name);
CREATE INDEX idx_overhead_costs_cost_type ON overhead_costs(cost_type);
CREATE INDEX idx_overhead_costs_is_active ON overhead_costs(is_active);
CREATE INDEX idx_overhead_costs_category ON overhead_costs(category);
CREATE INDEX idx_quote_costs_quote_id ON quote_costs(quote_id);
CREATE INDEX idx_quote_costs_quote_item_id ON quote_costs(quote_item_id);
CREATE INDEX idx_quote_costs_product_id ON quote_costs(product_id);
CREATE INDEX idx_quote_profit_summary_quote_id ON quote_profit_summary(quote_id);
CREATE INDEX idx_quote_profit_summary_is_paid ON quote_profit_summary(is_paid);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_service_id ON products(service_id);
CREATE INDEX idx_products_pricing_type ON products(pricing_type);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_product_tiers_product_id ON product_tiers(product_id);
CREATE INDEX idx_product_tiers_threshold ON product_tiers(threshold);
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_quote_items_product_id ON quote_items(product_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_upload_date ON files(upload_date);

-- Additional constraints for quote profit tracking
ALTER TABLE quote_profit_summary ADD CONSTRAINT unique_quote_profit_summary UNIQUE (quote_id);

-- Data validation constraints
ALTER TABLE products ADD CONSTRAINT chk_base_rate_positive CHECK (base_rate >= 0);
ALTER TABLE products ADD CONSTRAINT chk_discount_rate_valid CHECK (discount_rate >= 0 AND discount_rate <= 1);
ALTER TABLE product_tiers ADD CONSTRAINT chk_tier_rate_positive CHECK (rate >= 0);
ALTER TABLE product_tiers ADD CONSTRAINT chk_tier_threshold_positive CHECK (threshold >= 0);
ALTER TABLE quote_items ADD CONSTRAINT chk_quantity_positive CHECK (quantity > 0);
ALTER TABLE quotes ADD CONSTRAINT chk_quote_totals_positive CHECK (subtotal >= 0 AND total_discount >= 0 AND total_charge >= 0);
ALTER TABLE invoices ADD CONSTRAINT chk_invoice_totals_positive CHECK (subtotal >= 0 AND total_discount >= 0 AND total_charge >= 0);
ALTER TABLE invoices ADD CONSTRAINT chk_invoice_dates CHECK (due_date >= issue_date);
ALTER TABLE files ADD CONSTRAINT chk_file_size_positive CHECK (size > 0);

-- Table and column comments for documentation
COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON TABLE clients IS 'Customer/client information for quotes and invoices';
COMMENT ON TABLE settings IS 'Application-wide settings including branding and payment details';
COMMENT ON TABLE services IS 'Agricultural services (formerly categories) with pricing units';
COMMENT ON TABLE product_costs IS 'Detailed cost breakdown per product for profit analysis';
COMMENT ON TABLE overhead_costs IS 'General business overhead expenses and calculations';
COMMENT ON TABLE quote_costs IS 'Detailed cost tracking for individual quote line items';
COMMENT ON TABLE quote_profit_summary IS 'Aggregated profit analysis per quote';
COMMENT ON TABLE products IS 'Agricultural products/services with flexible pricing configurations';
COMMENT ON TABLE product_tiers IS 'Tiered pricing rates based on quantity or application rate thresholds';
COMMENT ON TABLE quotes IS 'Customer quotes with line items and totals';
COMMENT ON TABLE quote_items IS 'Individual line items within quotes with operational parameters';
COMMENT ON TABLE invoices IS 'Invoices generated from accepted quotes';
COMMENT ON TABLE files IS 'File storage metadata for PDFs, logos, and other uploads';

COMMENT ON COLUMN products.pricing_type IS 'Pricing model: tiered (quantity-based), flat (fixed rate), per_km (distance-based)';
COMMENT ON COLUMN products.base_rate IS 'Base rate in currency units per unit of measurement';
COMMENT ON COLUMN products.discount_threshold IS 'Minimum quantity for automatic discount eligibility';
COMMENT ON COLUMN products.discount_rate IS 'Discount percentage as decimal (0.1 = 10%)';
COMMENT ON COLUMN product_tiers.threshold IS 'Quantity threshold for this pricing tier';
COMMENT ON COLUMN product_tiers.rate IS 'Rate per unit at this tier level';
COMMENT ON COLUMN quote_items.speed IS 'Operating speed in km/h or mph for drone operations';
COMMENT ON COLUMN quote_items.flow_rate IS 'Flow rate in L/min or gal/min for spraying operations';
COMMENT ON COLUMN quote_items.spray_width IS 'Spray width in meters or feet';
COMMENT ON COLUMN quote_items.app_rate IS 'Calculated application rate in L/ha or gal/acre';
COMMENT ON COLUMN quote_items.calculation IS 'JSON: {rate, subtotal, discount, finalTotal, appliedTier}';
COMMENT ON COLUMN settings.branding IS 'JSON: {companyName, website, contactInfo: {email, phone, address}}';
COMMENT ON COLUMN settings.payments IS 'JSON: {bankName, accountName, accountNumber, branchCode}';
COMMENT ON COLUMN invoices.banking IS 'JSON: banking details copied from settings at invoice creation';
COMMENT ON COLUMN product_costs.cost_category IS 'Legacy field - cost categorization is now automatic via product->service relationship';
COMMENT ON COLUMN overhead_costs.category IS 'Legacy field - maintained for backward compatibility during transition';
COMMENT ON COLUMN overhead_costs.monthly_amount IS 'Legacy field - maintained for backward compatibility during transition';
COMMENT ON COLUMN overhead_costs.percentage_rate IS 'Legacy field - maintained for backward compatibility during transition';

-- Seed data for production use

-- SECURITY NOTE: Create admin user manually after deployment
-- Run this command in PostgreSQL with a secure password:
-- INSERT INTO users (name, email, password_hash, role) VALUES 
-- ('Administrator', 'admin@yourcompany.com', crypt('YOUR_SECURE_PASSWORD', gen_salt('bf')), 'admin');

-- Default application settings
INSERT INTO settings (currency, language, branding, payments) VALUES 
('R', 'en', 
 '{"companyName": "AgriHover Drone Services", "website": "https://www.agrihover.com", "contactInfo": {"email": "info@agrihover.com", "phone": "+27 11 123 4567", "address": "123 Agriculture Street, Johannesburg, 2000"}}',
 '{"bankName": "First National Bank", "accountName": "AgriHover Drone Services", "accountNumber": "12345678901", "branchCode": "250655"}'
) ON CONFLICT DO NOTHING;

-- Default services (migrated from categories)
INSERT INTO services (name, description, unit) VALUES 
('Spraying', 'Drone spraying services with tiered pricing', 'liters/ha'),
('Granular', 'Granular application with tiered pricing', 'kg/ha'),
('Travelling', 'Travel charges per kilometer', 'km'),
('Imaging', 'Aerial imaging services', 'hectares'),
('Accommodation', 'Accommodation services', 'nights'),
('Tank Hire', 'Tank hire services', 'days')
ON CONFLICT (name) DO NOTHING;

-- Sample overhead costs (consolidated from all migrations)
INSERT INTO overhead_costs (cost_name, cost_type, cost_value, applies_to, description, category, monthly_amount, percentage_rate) VALUES
('Office Rent', 'fixed_amount', 3000.00, 'all', 'Monthly office rental and utilities', 'Office Rent', 3000.00, NULL),
('Insurance', 'fixed_amount', 800.00, 'all', 'Equipment and liability insurance', 'Insurance', 800.00, NULL),
('General Overhead', 'percentage', 10.0, 'revenue', '10% of revenue for general overhead', 'General Admin', NULL, 10.0),
('Administrative Costs', 'percentage', 8.0, 'direct_costs', '8% of direct costs for administration', 'General Admin', NULL, 8.0),
('Marketing & Sales', 'percentage', 3.0, 'revenue', '3% of revenue for marketing costs', 'Fuel Overhead', NULL, 3.0)
ON CONFLICT DO NOTHING;

-- Migration: Add website field to existing branding data (for databases created before this update)
-- This ensures compatibility with existing installations
DO $$
BEGIN
    -- Check if any settings exist without website field in branding
    IF EXISTS (
        SELECT 1 FROM settings 
        WHERE branding IS NOT NULL 
        AND NOT (branding ? 'website')
    ) THEN
        -- Add website field to existing branding data
        UPDATE settings 
        SET branding = branding || '{"website": "https://www.yourcompany.com"}'
        WHERE branding IS NOT NULL 
        AND NOT (branding ? 'website');
        
        RAISE NOTICE 'Website field added to existing branding data. Please update with your actual website URL in the admin settings.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors in case the settings table doesn't exist yet
        NULL;
END $$;

-- Verification: Display current branding structure (optional - comment out in production)
-- SELECT 
--     branding->>'companyName' as company_name,
--     branding->>'website' as website,
--     branding->'contactInfo'->>'email' as email,
--     branding->'contactInfo'->>'phone' as phone,
--     branding->'contactInfo'->>'address' as address
-- FROM settings 
-- LIMIT 1;

-- Final verification: Check that all tables have been created successfully
-- Uncomment and run this query to verify schema deployment
/*
SELECT 
    table_name, 
    table_type,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables:
-- users, clients, settings, services, product_costs, overhead_costs,
-- quote_costs, quote_profit_summary, products, product_tiers, quotes, quote_items, 
-- invoices, files
*/

-- Schema deployment complete - AgriHover database ready for use!