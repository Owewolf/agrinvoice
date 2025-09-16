import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Package } from 'lucide-react';
import { Category } from '@/types/api';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

interface CategoryManagementProps {
  onNavigate: (page: string) => void;
}

export default function CategoryManagement({ onNavigate }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', unit: 'unit' });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const loadedCategories = await apiService.getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setCategoryLoading(true);
    try {
      const createdCategory = await apiService.createCategory(newCategory);
      setCategories([...categories, createdCategory]);
      setNewCategory({ name: '', description: '', unit: 'unit' });
      setIsAddCategoryOpen(false);
      toast.success('Category added successfully!');
    } catch (error) {
      toast.error('Failed to add category');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setCategoryLoading(true);
    try {
      const updatedCategory = await apiService.updateCategory(editingCategory.id, {
        name: editingCategory.name,
        description: editingCategory.description,
        unit: editingCategory.unit
      });
      setCategories(categories.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
      setEditingCategory(null);
      setIsEditCategoryOpen(false);
      toast.success('Category updated successfully!');
    } catch (error) {
      toast.error('Failed to update category');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone and may affect existing products.')) {
      return;
    }

    setCategoryLoading(true);
    try {
      await apiService.deleteCategory(categoryId);
      setCategories(categories.filter(cat => cat.id !== categoryId));
      toast.success('Category deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete category. It may be in use by existing products.');
    } finally {
      setCategoryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('admin-settings')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin Settings
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Category Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">Category Name</Label>
                      <Input
                        id="categoryName"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        placeholder="e.g., Spraying Services"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoryDescription">Description</Label>
                      <Textarea
                        id="categoryDescription"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        placeholder="Brief description of this category"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoryUnit">Unit</Label>
                      <Select
                        value={newCategory.unit}
                        onValueChange={(value) => setNewCategory({ ...newCategory, unit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hectares">Hectares</SelectItem>
                          <SelectItem value="liters/ha">Liters per Hectare</SelectItem>
                          <SelectItem value="kg/ha">Kilograms per Hectare</SelectItem>
                          <SelectItem value="km">Kilometers</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="nights">Nights</SelectItem>
                          <SelectItem value="unit">Units</SelectItem>
                          <SelectItem value="pieces">Pieces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddCategory} disabled={categoryLoading}>
                        {categoryLoading ? 'Adding...' : 'Add Category'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Product Categories</span>
            </CardTitle>
            <CardDescription>
              Manage service categories for your products
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No categories found. Add your first category to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <Badge variant="outline" className="mt-1">
                            {category.id.slice(0, 8)}...
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {category.description || 'No description provided'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{category.unit}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setIsEditCategoryOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Category Dialog */}
        <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editCategoryName">Category Name</Label>
                <Input
                  id="editCategoryName"
                  value={editingCategory?.name || ''}
                  onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, name: e.target.value } : null)}
                  placeholder="e.g., Spraying Services"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategoryDescription">Description</Label>
                <Textarea
                  id="editCategoryDescription"
                  value={editingCategory?.description || ''}
                  onChange={(e) => setEditingCategory(editingCategory ? { ...editingCategory, description: e.target.value } : null)}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategoryUnit">Unit</Label>
                <Select
                  value={editingCategory?.unit || 'unit'}
                  onValueChange={(value) => setEditingCategory(editingCategory ? { ...editingCategory, unit: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hectares">Hectares</SelectItem>
                    <SelectItem value="liters/ha">Liters per Hectare</SelectItem>
                    <SelectItem value="kg/ha">Kilograms per Hectare</SelectItem>
                    <SelectItem value="km">Kilometers</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="nights">Nights</SelectItem>
                    <SelectItem value="unit">Units</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditCategory} disabled={categoryLoading}>
                  {categoryLoading ? 'Updating...' : 'Update Category'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
