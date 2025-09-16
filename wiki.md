# AgriHover Application Wiki

## Overview
AgriHover is a comprehensive professional drone services invoice and quote management application specifically designed for agricultural businesses. It provides a complete solution for managing clients, creating detailed quotes with operational parameters, generating professional invoices, tracking business performance, and managing agricultural service products with sophisticated pricing models.

## Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe component development
- **Vite** for build tooling and fast development server
- **Tailwind CSS** for utility-first styling and responsive design
- **shadcn/ui** component library for consistent, accessible UI elements
- **React Router** for client-side navigation with search parameters
- **React Hook Form** with Zod validation for robust form management
- **Recharts** for interactive data visualization and business analytics
- **Lucide React** for consistent iconography
- **Sonner** for toast notifications

### Backend
- **Node.js** with Express framework for RESTful API
- **PostgreSQL** database with JSONB support for flexible data storage
- **JWT** for stateless authentication with role-based access control
- **bcrypt** for secure password hashing
- **CORS** configured for cross-origin requests
- **Multer** for file upload handling
- **UUID** for secure primary keys

### Development Tools
- **ESLint** with TypeScript rules for code quality
- **TypeScript** for comprehensive type safety
- **PostCSS** for CSS processing and optimization
- **pnpm** for efficient package management
- **Vite** for hot module replacement and fast builds

## Application Architecture

### Authentication System
- JWT-based stateless authentication with refresh token support
- Role-based access control (admin, user roles)
- Secure password hashing using bcrypt with salt rounds
- Middleware protection for all authenticated routes
- Login/logout functionality with automatic token validation
- Session persistence with secure token storage

### Client Management System
- Complete CRUD operations for client records
- Comprehensive client profiles with contact details, billing information, and service history
- Advanced search, filter, and sorting capabilities
- Client statistics dashboard with performance metrics
- Client relationship tracking and communication history
- Integration with quote and invoice systems

### Quote Management System
- Multi-step quote builder with operational parameter calculations
- Product selection from comprehensive agricultural services catalog
- Real-time pricing calculations with tiered pricing support
- Operational parameters: speed (km/h), flow rate (L/min), spray width (m), application rate (L/ha)
- Quote status tracking: draft, sent, accepted, rejected, expired
- Quote-to-invoice conversion with data inheritance
- Edit existing quotes with parameter preservation
- Duplicate quote functionality for similar services
- PDF generation for professional quote presentation

### Invoice Management System
- Automatic invoice generation from accepted quotes
- Sequential invoice numbering with customizable formats
- Due date tracking with aging reports
- Payment status management: pending, paid, overdue
- Financial totals inheritance from quotes (subtotal, discounts, final total)
- Professional PDF generation with company branding
- Banking information integration for payment processing

### Product Catalog & Pricing Engine
- Comprehensive agricultural services database
- Multiple pricing models:
  - **Tiered Pricing**: Based on application rate thresholds (L/ha)
  - **Flat Rate**: Fixed rate per unit area
  - **Per-Kilometer**: Distance-based pricing for specialized services
- Category-based product organization (herbicides, insecticides, fungicides, fertilizers)
- Discount threshold configuration with automatic application
- Product tier management with threshold-based rate calculations
- Real-time pricing calculations based on operational parameters

### Dashboard & Business Analytics
- Executive dashboard with key performance indicators
- Revenue tracking with trend analysis over time
- Quote conversion rate analytics
- Client acquisition and retention metrics
- Recent activity feeds and notifications
- Interactive charts for visual data representation
- Business performance summaries and insights

### File Management System
- Secure file upload and storage capabilities
- Document management for quotes, invoices, and client files
- File type validation and size limitations
- Secure file serving with access control
- Integration with quote and invoice PDF generation

## Database Schema

### Core Tables

#### Users Table
- **id**: UUID primary key
- **name**: Full user name
- **email**: Unique email address
- **password_hash**: bcrypt hashed password
- **role**: User role (admin, user)
- **created_at/updated_at**: Automatic timestamps

#### Clients Table
- **id**: UUID primary key
- **name**: Client company/individual name
- **contact_person**: Primary contact name
- **email**: Client email address
- **phone**: Contact phone number
- **address**: Physical address
- **billing_address**: Billing address (if different)
- **created_by**: Foreign key to users table
- **created_at/updated_at**: Automatic timestamps

#### Products Table
- **id**: UUID primary key
- **name**: Product/service name
- **description**: Detailed description
- **category**: Product category (herbicide, insecticide, etc.)
- **unit**: Unit of measurement (hectares, acres)
- **pricing_type**: Pricing model (tiered, flat, per_km)
- **base_rate**: Base rate for calculations
- **discount_threshold**: Minimum quantity for discounts
- **discount_rate**: Discount percentage (0.1 = 10%)
- **created_at/updated_at**: Automatic timestamps

#### Product Tiers Table
- **id**: UUID primary key
- **product_id**: Foreign key to products table
- **threshold**: Application rate threshold (L/ha)
- **rate**: Rate per hectare at this tier level
- **created_at/updated_at**: Automatic timestamps

#### Quotes Table
- **id**: UUID primary key
- **quote_number**: Unique quote identifier
- **client_id**: Foreign key to clients table
- **user_id**: Foreign key to users table (creator)
- **status**: Quote status (draft, sent, accepted, rejected)
- **quote_date**: Date quote was created
- **valid_until**: Quote expiration date
- **subtotal**: Pre-discount total amount
- **total_discount**: Total discount amount applied
- **total_charge**: Final total amount
- **notes**: Additional notes or terms
- **created_at/updated_at**: Automatic timestamps

#### Quote Items Table
- **id**: UUID primary key
- **quote_id**: Foreign key to quotes table
- **product_id**: Foreign key to products table
- **quantity**: Service area quantity
- **rate**: Calculated rate per unit
- **speed**: Operating speed (km/h)
- **flow_rate**: Flow rate (L/min)
- **spray_width**: Spray width (meters)
- **app_rate**: Calculated application rate (L/ha)
- **calculation**: JSONB field with detailed calculations
- **created_at/updated_at**: Automatic timestamps

#### Invoices Table
- **id**: UUID primary key
- **invoice_number**: Unique invoice identifier
- **quote_id**: Foreign key to quotes table
- **issue_date**: Invoice issue date
- **due_date**: Payment due date
- **status**: Invoice status (draft, sent, paid, overdue)
- **subtotal**: Pre-discount total (inherited from quote)
- **total_discount**: Total discount applied (inherited from quote)
- **total_charge**: Final amount due (inherited from quote)
- **banking**: JSONB field with banking information
- **created_at/updated_at**: Automatic timestamps

#### Files Table
- **id**: UUID primary key
- **filename**: Original filename
- **filepath**: Server file path
- **mimetype**: File MIME type
- **size**: File size in bytes
- **related_type**: Related entity type (quote, invoice, client)
- **related_id**: Foreign key to related entity
- **uploaded_by**: Foreign key to users table
- **created_at**: Upload timestamp

#### Settings Table
- **id**: UUID primary key
- **currency**: Default currency (R, USD, etc.)
- **language**: Default language (en, af, etc.)
- **branding**: JSONB field with company branding information
- **payments**: JSONB field with payment/banking details
- **created_at/updated_at**: Automatic timestamps

### Database Features
- **UUID Primary Keys**: Enhanced security and distributed system compatibility
- **Automatic Timestamps**: Trigger-based timestamp management for all tables
- **Foreign Key Constraints**: Data integrity enforcement
- **Performance Indexes**: Optimized queries for common operations
- **JSONB Fields**: Flexible data storage for complex configurations
- **Check Constraints**: Data validation at database level

## User Interface & Navigation

### Universal Header System
- **Consistent User Display**: User name and role badge displayed in the universal header across all pages
- **Authentication Status**: Real-time display of logged-in user information with online status
- **Role-Based Badges**: Visual distinction between admin and user roles with appropriate styling
- **Responsive Design**: Adaptive header layout for desktop and mobile devices
- **Date Display**: Current date badge alongside user information for context
- **Clean Architecture**: Centralized user display eliminates code duplication across pages

### Layout System
- **MainLayout Component**: Universal layout wrapper providing consistent header across all pages
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Bottom Navigation**: Mobile-optimized navigation with touch-friendly interface
- **Hamburger Menu**: Desktop navigation with collapsible sidebar
- **Professional Styling**: Clean, modern interface with consistent branding
- **Accessibility**: WCAG compliant components with keyboard navigation

### Navigation Structure
- **Dashboard**: Business overview and key metrics
- **Clients**: Client management and relationship tracking
- **Products**: Product catalog and pricing management
- **New Quote**: Multi-step quote creation wizard
- **Quote History**: Quote management and status tracking
- **Invoice History**: Invoice management and payment tracking
- **Admin Settings**: System configuration and branding

### Component Architecture
- **shadcn/ui Library**: Consistent, accessible UI components
- **Universal Header**: Centralized user authentication display in MainLayout component
- **Page-Specific Headers**: Clean page headers without duplicated user information
- **Form Components**: Validated forms with real-time feedback
- **Data Tables**: Sortable, filterable tables with pagination
- **Modal System**: Overlay dialogs for forms and confirmations
- **Loading States**: Progressive loading with skeleton screens
- **Error Handling**: Graceful error display with recovery options
- **Toast Notifications**: Non-intrusive status messages
- **Role-Based UI**: Conditional rendering based on user permissions

## Key Features & Functionality

### Advanced Quote Creation
- **Multi-Step Builder**: Guided quote creation process
- **Product Selection**: Searchable product catalog with filtering
- **Operational Parameters**: Speed, flow rate, spray width configuration
- **Real-Time Calculations**: Automatic application rate and pricing calculations
- **Tiered Pricing Engine**: Automatic rate calculation based on application thresholds
- **Discount Application**: Automatic discount calculation for qualifying quantities
- **Parameter Validation**: Operational parameter validation and recommendations
- **Quote Preview**: Real-time quote preview with professional formatting

### Professional PDF Generation
- **Branded Documents**: Company logo and branding integration
- **Detailed Line Items**: Complete breakdown of services and calculations
- **Operational Details**: Speed, flow rate, application rate documentation
- **Payment Terms**: Banking information and payment instructions
- **Professional Layout**: Clean, business-appropriate formatting
- **Download/Email**: Direct download and email delivery capabilities

### Business Intelligence & Analytics
- **Revenue Analytics**: Revenue tracking with trend analysis
- **Conversion Metrics**: Quote-to-invoice conversion rates
- **Client Performance**: Client activity and value analysis
- **Product Insights**: Most popular services and pricing trends
- **Time-Based Reports**: Performance over various time periods
- **Visual Dashboards**: Interactive charts and graphs
- **KPI Monitoring**: Key performance indicator tracking

### Advanced File Management
- **Secure Upload**: File type and size validation
- **Document Storage**: Organized file storage by entity type
- **Access Control**: Role-based file access permissions
- **Version Control**: File versioning for document updates
- **Integration**: Seamless integration with quotes and invoices

## API Architecture

### Authentication Endpoints
- `POST /api/auth/login` - User authentication with JWT generation
- `POST /api/auth/logout` - Session termination and token invalidation
- `GET /api/auth/verify` - Token validation and user information retrieval
- `POST /api/auth/refresh` - JWT token refresh mechanism

### Client Management API
- `GET /api/clients` - Paginated client listing with search, filter, and real-time statistics
- `POST /api/clients` - Create new client with validation and camelCase field formatting
- `GET /api/clients/:id` - Detailed client information retrieval with proper field transformation
- `PUT /api/clients/:id` - Client information updates with consistent field naming
- `DELETE /api/clients/:id` - Client deletion with cascade handling
- `GET /api/clients/:id/stats` - Client-specific statistics including totalQuotes, totalInvoices, outstandingAmount

### Product Management API
- `GET /api/products` - Product catalog with category filtering
- `POST /api/products` - New product creation with pricing configuration
- `GET /api/products/:id` - Detailed product information including tiers
- `PUT /api/products/:id` - Product updates including pricing modifications
- `DELETE /api/products/:id` - Product deletion with usage validation
- `GET /api/products/:id/tiers` - Product tier pricing information

### Quote Management API
- `GET /api/quotes` - Quote listing with status filtering and pagination
- `POST /api/quotes` - Quote creation with item validation and calculations
- `GET /api/quotes/:id` - Complete quote details with product information
- `PUT /api/quotes/:id` - Quote modifications with recalculation
- `DELETE /api/quotes/:id` - Quote deletion with dependency checking
- `POST /api/quotes/:id/convert` - Quote-to-invoice conversion

### Invoice Management API
- `GET /api/invoices` - Invoice listing with payment status filtering
- `POST /api/invoices` - Invoice creation from quotes
- `GET /api/invoices/:id` - Detailed invoice information with proper field transformation
- `PUT /api/invoices/:id` - Full invoice updates (issue date, due date, banking, status)
- `PATCH /api/invoices/:id/status` - Invoice status updates with proper field formatting
- `GET /api/invoices/:id/pdf` - PDF generation and download

### Settings & Configuration API
- `GET /api/settings` - Application configuration retrieval
- `PUT /api/settings` - Configuration updates including branding
- `POST /api/settings/branding` - Logo and branding asset upload

## Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Role-Based Access**: Granular permissions based on user roles
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Session Management**: Secure token storage and automatic renewal
- **API Protection**: Middleware-based route protection

### Data Security
- **Input Validation**: Comprehensive server-side validation
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Protection**: Content sanitization and CSP headers
- **CORS Configuration**: Restricted cross-origin access
- **File Upload Security**: Type validation and size limitations
- **UUID Usage**: Non-sequential identifiers for enhanced security

### Infrastructure Security
- **Environment Variables**: Secure configuration management
- **Database Encryption**: Encrypted connections and data at rest
- **Error Handling**: Secure error messages without information leakage
- **Logging**: Comprehensive audit trails for security monitoring
- **Rate Limiting**: API abuse prevention mechanisms

## Performance Optimization

### Database Performance
- **Strategic Indexing**: Optimized indexes for common query patterns
- **Query Optimization**: Efficient JOINs and query structure
- **Connection Pooling**: Database connection management
- **JSONB Usage**: Efficient semi-structured data storage
- **Pagination**: Efficient data retrieval for large datasets

### Frontend Performance
- **Code Splitting**: Lazy loading for optimal bundle sizes
- **Component Optimization**: Efficient React rendering patterns
- **Caching Strategies**: Strategic data caching and state management
- **Image Optimization**: Optimized asset delivery
- **Build Optimization**: Vite-based build optimizations

## Development & Deployment

### Development Environment Setup
```bash
# Prerequisites: Node.js 18+, PostgreSQL 12+, pnpm
git clone <repository>
cd agri_invoice

# Install dependencies
pnpm install

# Database setup
createdb agrihover
psql agrihover < agrihover.sql

# Environment configuration
cp .env.example .env
# Configure database credentials and JWT secrets

# Start development servers
pnpm dev         # Frontend development server
pnpm server      # Backend API server
```

### Production Deployment
- **Environment Configuration**: Production environment variables
- **Database Migrations**: Automated schema updates
- **SSL/TLS Setup**: Secure HTTPS configuration
- **Process Management**: PM2 or similar process managers
- **Reverse Proxy**: Nginx configuration for load balancing
- **Monitoring**: Application and infrastructure monitoring
- **Backup Strategy**: Automated database backups

### Testing Strategy
- **Unit Testing**: Component and function-level testing
- **Integration Testing**: API endpoint testing
- **End-to-End Testing**: Complete user workflow testing
- **Performance Testing**: Load and stress testing
- **Security Testing**: Vulnerability assessment

## Advanced Features

### Calculation Engine
- **Application Rate Calculation**: speed × flow_rate ÷ (spray_width × 600)
- **Tiered Pricing Logic**: Automatic rate selection based on application thresholds
- **Discount Application**: Threshold-based discount calculations
- **Real-Time Updates**: Dynamic recalculation on parameter changes
- **Validation Rules**: Operational parameter validation and constraints

### Reporting System
- **Financial Reports**: Revenue, profit, and loss reporting
- **Operational Reports**: Service efficiency and productivity metrics
- **Client Reports**: Client-specific performance and history
- **Custom Date Ranges**: Flexible reporting periods
- **Export Capabilities**: CSV, PDF, and Excel export options

### Integration Capabilities
- **Email Integration**: Automated quote and invoice delivery
- **Accounting Software**: QuickBooks, Xero integration potential
- **Payment Gateways**: Online payment processing integration
- **Mobile API**: Mobile application support
- **Third-Party Services**: Weather data, GPS integration potential

## Recent Updates & Improvements

### Invoice Status Update System (September 2025)
- **Fixed Invoice Status Updates**: Resolved critical issue where invoice status changes weren't persisting to database
- **API Consistency**: Fixed PATCH endpoint to return properly formatted camelCase field names (totalCharge, totalDiscount, etc.)
- **Frontend Error Handling**: Added comprehensive null checks for financial fields to prevent undefined errors
- **Database Field Mapping**: Fixed field name conflicts in invoice GET by ID queries using explicit field aliasing
- **Status Persistence**: Removed redundant storage calls that were causing 500 errors on status updates
- **User Feedback**: Added proper toast notifications for successful status changes and error handling

### Client Data Display Enhancement (September 2025)
- **Real-time Statistics**: Fixed clients page to display current data for quotes, invoices, and outstanding amounts
- **Backend Query Optimization**: Implemented JOINs to aggregate client statistics (totalQuotes, totalInvoices, outstandingAmount)
- **Field Name Standardization**: Converted all API responses to consistent camelCase formatting
- **Outstanding Amount Calculation**: Properly calculates amounts based on invoice status (sent/overdue contribute, paid/draft don't)
- **Data Accuracy**: Fixed field conflicts and type mismatches between API and frontend interfaces

### Dashboard User Experience (September 2025)
- **Removed Duplicate Navigation**: Eliminated redundant action cards that duplicated menu bar functionality
- **Enhanced Analytics Focus**: Redesigned dashboard to prioritize data insights over navigation
- **Top Customers Improvement**: Converted navigation card into proper analytics display with ranking and revenue data
- **Cleaner Layout**: Improved visual hierarchy and organization for better user experience
- **Navigation Consolidation**: All navigation functions now exclusively handled through menu systems

### Universal Header Implementation (September 2025)
- **Centralized User Display**: Implemented universal header in MainLayout component showing user name and role badge
- **Consistent UI**: User information now appears consistently across all pages next to the date
- **Code Cleanup**: Removed duplicate user display implementations from individual pages (Dashboard, QuoteHistory, QuotePreview, NewQuote, Products)
- **Responsive Design**: Universal header adapts to both desktop and mobile layouts
- **Authentication Integration**: Real-time user status display with proper role-based styling
- **Maintainability**: Single source of truth for user display reduces code duplication and improves maintenance

### Bug Fixes & Stability Improvements
- **TypeScript Compilation**: Resolved all TypeScript errors and type mismatches across the application
- **Database Constraints**: Fixed null constraint violations in invoice updates
- **API Response Format**: Standardized all endpoints to return consistent field naming conventions
- **Error Boundary**: Added proper error handling for undefined financial calculations
- **Authentication Flow**: Maintained proper authentication logic while cleaning up UI components

### Component Refactoring
- **MainLayout.tsx**: Enhanced with user authentication state management and display logic
- **Individual Pages**: Cleaned up to remove redundant user display while preserving functional authentication logic
- **React Hooks**: Fixed useEffect dependency warnings for proper component lifecycle management
- **Type Safety**: Maintained TypeScript type safety throughout the refactoring process

## Directory Structure

```
agri_invoice/
├── README.md               # Project documentation
├── package.json            # Dependencies and scripts
├── components.json         # shadcn/ui component configuration
├── eslint.config.js        # Code quality configuration
├── tailwind.config.ts      # Styling configuration
├── vite.config.ts          # Build tool configuration
├── agrihover.sql           # Complete database schema
├── wiki.md                 # Comprehensive documentation
├── public/                 # Static assets
│   ├── favicon.svg
│   ├── robots.txt
│   └── images/
│       └── Logo.jpg        # Company logo
├── src/                    # Application source code
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   ├── server.js           # Express backend server
│   ├── components/         # Reusable UI components
│   │   ├── AuthGuard.tsx   # Authentication protection
│   │   ├── clients/        # Client management components
│   │   ├── layout/         # Layout components
│   │   │   └── MainLayout.tsx # Universal layout with header
│   │   ├── navigation/     # Navigation components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries and services
│   │   ├── api.ts          # API client configuration
│   │   ├── auth.ts         # Authentication utilities
│   │   ├── calculator.ts   # Pricing calculations
│   │   ├── products.ts     # Product management
│   │   └── storage.ts      # Data persistence
│   ├── middleware/         # Backend middleware
│   │   └── auth.js         # JWT authentication
│   ├── pages/              # Application pages
│   │   ├── Dashboard.tsx   # Business overview
│   │   ├── Login.tsx       # User authentication
│   │   ├── Clients.tsx     # Client management
│   │   ├── Products.tsx    # Product catalog
│   │   ├── NewQuote.tsx    # Quote creation
│   │   ├── QuoteHistory.tsx # Quote management
│   │   ├── InvoiceHistory.tsx # Invoice management
│   │   └── AdminSettings.tsx # System configuration
│   ├── routes/             # Backend API routes
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── clients.js      # Client management API
│   │   ├── products.js     # Product management API
│   │   ├── quotes.js       # Quote management API
│   │   ├── invoices.js     # Invoice management API
│   │   └── settings.js     # Configuration API
│   └── types/              # TypeScript definitions
│       ├── index.ts        # Common types
│       ├── client.ts       # Client-related types
│       └── api.ts          # API response types
```

## Troubleshooting & Maintenance

### Common Issues & Solutions
- **Database Connection**: Connection string validation and pooling configuration
- **Authentication Problems**: JWT token validation and expiration handling
- **File Upload Issues**: File size limits and type validation
- **Performance Issues**: Query optimization and caching strategies
- **CORS Errors**: Origin configuration and preflight handling

### Monitoring & Logging
- **Application Logs**: Structured logging with appropriate levels
- **Database Monitoring**: Query performance and connection monitoring
- **Error Tracking**: Comprehensive error reporting and alerting
- **Performance Metrics**: Response time and throughput monitoring
- **Security Monitoring**: Authentication failure and suspicious activity tracking

### Backup & Recovery
- **Database Backups**: Automated daily backups with retention policies
- **File Backups**: Document and asset backup strategies
- **Disaster Recovery**: System recovery procedures and documentation
- **Data Integrity**: Regular integrity checks and validation

## Future Development Roadmap

### Planned Enhancements
- **Mobile Application**: Native iOS and Android applications
- **Advanced Analytics**: Machine learning-based insights and predictions
- **Multi-Tenant Support**: SaaS-ready multi-company architecture
- **API Marketplace**: Third-party integration ecosystem
- **Automated Workflows**: Smart automation for routine tasks
- **Advanced Reporting**: Custom report builder and dashboard designer
- **Enhanced User Management**: Advanced user roles and permission system
- **Notification System**: Real-time notifications and alerts

### Technical Improvements
- **Microservices Architecture**: Service-oriented architecture migration
- **GraphQL API**: Flexible data querying capabilities
- **Real-Time Features**: WebSocket-based real-time updates
- **Advanced Caching**: Redis-based caching strategies
- **Container Deployment**: Docker and Kubernetes deployment
- **CI/CD Pipeline**: Automated testing and deployment workflows

This comprehensive wiki documents the AgriHover application as a complete, production-ready agricultural drone services management platform with sophisticated features for quote management, invoice generation, client relationship management, and business analytics.