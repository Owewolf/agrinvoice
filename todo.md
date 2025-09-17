 # TODO: Cost and Profit Analysis Implementation Plan

This document outlines the remaining tasks to fully integrate the cost tracking and profit analysis system into the application. The database schema for costs is already in place; this plan focuses on the API and frontend implementation.

## 1. **Backend API Implementation (`src/routes/costs.js`)**

The primary task is to create API endpoints to manage and retrieve cost data.

**File to Create:** `src/routes/costs.js`

**Endpoints to Implement:**

-   **Cost Management (CRUD):**
    -   `GET /api/costs/services`: Fetch all service costs.
    -   `POST /api/costs/services`: Create a new service cost.
    -   `PUT /api/costs/services/:id`: Update a service cost.
    -   `DELETE /api/costs/services/:id`: Delete a service cost.
    -   (Repeat for `products` and `overheads`).
-   **Profit Calculation Engine:**
    -   `POST /api/costs/calculate`: This is a critical endpoint that will receive invoice data, calculate the total costs (direct and overhead), and return a full profit breakdown. This will be used by the `InvoicePreview` page.

## 2. **Frontend API Service (`src/lib/api.ts`)**

Update the `apiService` to include functions for interacting with the new `/api/costs` endpoints.

**File to Modify:** `src/lib/api.ts`

**Functions to Add:**

```typescript
// In apiService object
// ...

// Costs
getServiceCosts: async () => {
  const response = await api.get('/costs/services');
  return response.data;
},
// Add similar functions for create, update, delete

getProductCosts: async () => {
  const response = await api.get('/costs/products');
  return response.data;
},
// Add similar functions for create, update, delete

getOverheadCosts: async () => {
  const response = await api.get('/costs/overheads');
  return response.data;
},
// Add similar functions for create, update, delete

calculateProfitAnalysis: async (invoiceData: any) => {
  const response = await api.post('/costs/calculate', invoiceData);
  return response.data;
},
```

## 3. **Frontend UI Implementation**

### **A. Cost Management Page (`src/pages/CostManagement.tsx`)**

The route and page component already exist. The task is to build out the UI to be a functional admin tool.

**File to Modify:** `src/pages/CostManagement.tsx`

**Implementation Steps:**

1.  **Use `<Tabs>`:** Create three tabs: "Service Costs", "Product Costs", and "Overhead Costs".
2.  **Use `<Table>`:** In each tab, display the corresponding costs using the existing `Table` component. The table should show key details and have "Edit" and "Delete" buttons.
3.  **Use `<Dialog>` for Forms:** Create a reusable `CostForm` component. When the "Add New" or "Edit" button is clicked, open this form in a `<Dialog>` modal.
4.  **Data Fetching:** Use `@tanstack/react-query` and the new `apiService` functions to fetch and manage cost data.

### **B. Invoice Profit Analysis (`src/pages/InvoicePreview.tsx`)**

This page is already set up to display profit analysis but needs to be connected to the working API.

**File to Modify:** `src/pages/InvoicePreview.tsx`

**Implementation Steps:**

1.  **Complete `loadProfitAnalysis` function:** Update this function to call the new `apiService.calculateProfitAnalysis` method, passing the invoice details.
2.  **Create `ProfitAnalysisPanel` Component:** Create a new component at `src/components/invoices/ProfitAnalysisPanel.tsx`. This component will receive the analysis data and display it clearly.
3.  **Render the Panel:** In `InvoicePreview.tsx`, when an invoice is marked as "Paid", render the `ProfitAnalysisPanel` in the sidebar.

**`ProfitAnalysisPanel` Mockup:**

```jsx
// src/components/invoices/ProfitAnalysisPanel.tsx

<Card>
  <CardHeader>
    <CardTitle className="flex items-center">
      <Calculator className="mr-2" />
      Profit Analysis
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex justify-between font-bold">
      <span>Revenue:</span>
      <span>{formatCurrency(analysis.revenue)}</span>
    </div>
    <div className="flex justify-between">
      <span>Direct Costs:</span>
      <span>-{formatCurrency(analysis.directCosts)}</span>
    </div>
    <div className="flex justify-between">
      <span>Overhead Costs:</span>
      <span>-{formatCurrency(analysis.overheadCosts)}</span>
    </div>
    <Separator className="my-2" />
    <div className="flex justify-between font-bold text-lg text-green-600">
      <span>NET PROFIT:</span>
      <span>{formatCurrency(analysis.netProfit)} ({analysis.margin}%)</span>
    </div>
    <Accordion type="single" collapsible className="w-full mt-4">
      <AccordionItem value="item-1">
        <AccordionTrigger>Detailed Breakdown</AccordionTrigger>
        <AccordionContent>
          {/* List detailed costs here */}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </CardContent>
</Card>
```

### **C. Dashboard Integration (`src/pages/Dashboard.tsx`)**

Enhance the dashboard with top-level profit metrics.

**File to Modify:** `src/pages/Dashboard.tsx` & `src/lib/dashboardAnalytics.ts`

**Implementation Steps:**

1.  **Update `dashboardAnalytics`:** Add logic to calculate total costs and net profit across all paid invoices.
2.  **Add New KPI Cards:**
    -   Add a "Total Costs" card.
    -   Add a "Net Profit" card.
3.  **Enhance Revenue Chart:** Modify the "Monthly Revenue Trend" chart (`MiniLineChart`) to be a `MiniBarChart` that compares `Revenue`, `Costs`, and `Profit` for each month.

## 4. **Action Plan (Step-by-Step)**

1.  **[Backend]** Create `src/routes/costs.js` and implement all CRUD and calculation endpoints.
2.  **[Frontend]** Update `src/lib/api.ts` with the new `apiService` functions for costs.
3.  **[Frontend]** Build the UI for the `CostManagement.tsx` page, enabling administrators to manage all cost types.
4.  **[Backend/Frontend]** Connect the `InvoicePreview.tsx` page to the `/api/costs/calculate` endpoint and build the `ProfitAnalysisPanel` component to display the results.
5.  **[Frontend]** Enhance the `Dashboard.tsx` with new profit-related KPIs and charts.
6.  **[Testing]** Thoroughly test the entire workflow, from adding costs to seeing the profit analysis on an invoice and the dashboard.