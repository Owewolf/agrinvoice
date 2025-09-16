FOLLOW STEP BY STEP AND ADJUST IF NEEDED _____________________update the AgriHover app to support dynamic product categories (beyond the hardcoded ones like spraying, granular, travelling, imaging, and accommodation), you'll need to make categories configurable via the database and API, rather than hardcoded in the frontend. This allows admins to add, edit, or remove categories through the AdminSettings page, and the Products page will reflect these changes dynamically.

### High-Level Approach
1. **Database Changes**: Add a `categories` table to store category data (id, name, description, etc.).
2. **Backend Updates**: Create API routes for CRUD operations on categories.
3. **Frontend Updates**: 
   - Fetch categories from the API instead of using hardcoded arrays.
   - Update AdminSettings to include a form for managing categories.
   - Update Products page to use dynamic categories for filtering and forms.
4. **Migration**: Ensure existing data migrates smoothly (e.g., seed the new table with current categories).

This keeps the app scalable and avoids hardcoding.

### Step-by-Step Implementation

#### 1. Update the Database Schema
Add a new table for categories in agrihover.sql. Run this as a migration.

```sql
-- Add categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with existing categories
INSERT INTO categories (name, description) VALUES 
('spraying', 'Drone spraying services with tiered pricing'),
('granular', 'Granular application with tiered pricing'),
('travelling', 'Travel charges per kilometer'),
('imaging', 'Aerial imaging services'),
('accommodation', 'Accommodation services');

-- Update products table to reference categories (if not already done)
ALTER TABLE products ADD COLUMN category_id UUID REFERENCES categories(id);
-- Migrate existing data (assuming category is currently a string)
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = products.category);
ALTER TABLE products DROP COLUMN category;
```

#### 2. Backend API Routes
Create a new router for categories in `src/routes/categories.js`.

```js
import express from 'express';
const router = express.Router();

export default function createCategoriesRouter(pool) {
  // Get all categories
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM categories ORDER BY name');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create category
  router.post('/', async (req, res) => {
    const { name, description } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
        [name, description]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update category
  router.put('/:id', async (req, res) => {
    const { name, description } = req.body;
    try {
      const result = await pool.query(
        'UPDATE categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [name, description, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete category
  router.delete('/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
      res.json({ message: 'Category deleted' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
```

Mount this router in your main server file (e.g., server.js).

#### 3. Frontend API Service
Update api.ts to include category endpoints.

```ts
// ...existing code...

// Categories
getCategories: async () => {
  const response = await api.get('/categories');
  return response.data;
},

createCategory: async (data: { name: string; description?: string }) => {
  const response = await api.post('/categories', data);
  return response.data;
},

updateCategory: async (id: string, data: { name: string; description?: string }) => {
  const response = await api.put(`/categories/${id}`, data);
  return response.data;
},

deleteCategory: async (id: string) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
},

// ...existing code...
```

#### 4. Update Products Library
Remove hardcoded categories and fetch dynamically in products.ts.

```ts
// Remove hardcoded PRODUCT_CATEGORIES
// export const PRODUCT_CATEGORIES = [...];

// Add function to fetch categories
import { apiService } from './api';

export async function getProductCategories() {
  try {
    return await apiService.getCategories();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return []; // Fallback to empty array
  }
}

// Update getUnitForCategory to handle dynamic categories
export function getUnitForCategory(categoryName: string, pricingType: PricingType): string {
  // Fetch unit based on category name (you may need to store unit in categories table)
  // For now, use defaults or extend the categories table to include unit
  switch (categoryName) {
    case 'spraying':
      return 'L/ha';
    case 'granular':
      return 'kg/ha';
    case 'travelling':
      return 'km';
    case 'imaging':
      return 'ha';
    case 'accommodation':
      return 'service';
    default:
      return 'unit';
  }
}
```

#### 5. Update AdminSettings Page
Add a section to manage categories in AdminSettings.tsx.

```tsx
// ...existing code...

// Add state for categories
const [categories, setCategories] = useState([]);

// Load categories on mount
useEffect(() => {
  const loadCategories = async () => {
    try {
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };
  loadCategories();
}, []);

// Add form for new category
const [newCategory, setNewCategory] = useState({ name: '', description: '' });

const handleAddCategory = async () => {
  try {
    const result = await apiService.createCategory(newCategory);
    setCategories([...categories, result]);
    setNewCategory({ name: '', description: '' });
  } catch (error) {
    console.error('Failed to add category:', error);
  }
};

// Update the "Product Categories Info" section to be dynamic
<Card>
  <CardHeader>
    <CardTitle>Product Categories</CardTitle>
    <CardDescription>Manage available product categories</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Add new category form */}
    <div className="grid grid-cols-2 gap-4">
      <Input
        placeholder="Category name"
        value={newCategory.name}
        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
      />
      <Input
        placeholder="Description"
        value={newCategory.description}
        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
      />
    </div>
    <Button onClick={handleAddCategory}>Add Category</Button>

    {/* List existing categories */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categories.map((cat) => (
        <div key={cat.id} className="p-4 border rounded-lg">
          <h3 className="font-medium">{cat.name}</h3>
          <p className="text-sm text-gray-500">{cat.description}</p>
          {/* Add edit/delete buttons as needed */}
        </div>
      ))}
    </div>
  </CardContent>
</Card>

// ...existing code...
```

#### 6. Update Products Page
Modify Products.tsx to fetch and use dynamic categories.

```tsx
// ...existing code...

// Replace hardcoded PRODUCT_CATEGORIES with dynamic fetch
const [categories, setCategories] = useState([]);

useEffect(() => {
  const loadCategories = async () => {
    const data = await getProductCategories();
    setCategories(data);
  };
  loadCategories();
}, []);

// Update TabsList to use dynamic categories
<TabsList className="mb-6">
  <TabsTrigger value="all">All Products ({products.length})</TabsTrigger>
  {categories.map(category => (
    <TabsTrigger key={category.id} value={category.name}>
      {category.name} ({products.filter(p => p.category === category.name).length})
    </TabsTrigger>
  ))}
</TabsList>

// Update form selects to use dynamic categories
<Select
  value={formData.category}
  onValueChange={(value) => {
    // ...existing logic...
  }}
>
  <SelectContent>
    {categories.map(category => (
      <SelectItem key={category.id} value={category.name}>
        {category.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// ...existing code...
```

#### 7. Migration and Testing
- Run the database migration to create the `categories` table and seed data.
- Test adding/editing categories in AdminSettings and verify they appear in Products.
- Update any other references to hardcoded categories (e.g., in products.ts for SKU generation).

This approach ensures categories are fully dynamic while maintaining backward compatibility. If you encounter issues with existing products, ensure the migration maps old string categories to the new table.
