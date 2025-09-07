import { Product } from '@/types/api';
import { apiService } from './api';
import { AxiosError } from 'axios';

class ProductStorageService {
  async getProducts(): Promise<Product[]> {
    try {
      return await apiService.getProducts();
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return this.getDefaultProducts();
    }
  }

  async saveProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> | Product): Promise<Product> {
    try {
      console.log('🔍 saveProduct called with product:', product);
      console.log('🔍 Product ID check:', {
        hasId: 'id' in product,
        idValue: ('id' in product) ? (product as Product).id : undefined,
        idTrimmed: ('id' in product) ? (product as Product).id?.trim() : undefined,
        isNotEmpty: ('id' in product) ? (product as Product).id?.trim() !== '' : false,
        noTemp: ('id' in product) ? !(product as Product).id?.includes('temp-') : true,
        shouldUpdate: 'id' in product && (product as Product).id && (product as Product).id.trim() !== '' && !(product as Product).id.includes('temp-')
      });
      
      let dataToSend;
      if ('id' in product && product.id && product.id.trim() !== '' && !product.id.includes('temp-')) {
        // Update existing product - strip the fields that shouldn't be sent in update
        const { id, createdAt, updatedAt, ...updateData } = product as Product;
        dataToSend = updateData;
        console.log('🔄 Updating existing product:', { id: product.id, data: dataToSend });
        const result = await apiService.updateProduct(product.id, dataToSend);
        console.log('✅ Product updated successfully:', result);
        return result;
      } else {
        // Create new product - strip the fields that shouldn't be sent
        const { id, createdAt, updatedAt, ...createData } = product as Product;
        dataToSend = createData;
        console.log('➕ Creating new product with data:', dataToSend);
        const result = await apiService.createProduct(dataToSend);
        console.log('✅ Product created successfully:', result);
        return result;
      }
    } catch (error) {
      console.error('❌ Failed to save product:', error);
      
      // Check for authentication errors
      const axiosError = error as AxiosError;
      if (axiosError?.response?.status === 401 || axiosError?.response?.status === 403) {
        console.error('❌ Authentication error - user needs to login first');
        alert('Authentication error: Please login first to save products.');
        // Clear invalid tokens
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('current_user');
      } else if (axiosError?.response?.status === 404) {
        console.error('❌ Product endpoint not found - check server routes');
        alert('Server error: Product endpoint not found. Please contact support.');
      } else {
        console.error('❌ Unexpected error saving product:', axiosError?.message || error);
        console.error('❌ Full error details:', axiosError?.response?.data);
        alert('Error saving product: ' + (axiosError?.message || 'Unknown error'));
      }
      
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await apiService.deleteProduct(productId);
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      return await apiService.getProduct(id);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return undefined;
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const products = await this.getProducts();
      return products.filter(p => p.category === category);
    } catch (error) {
      console.error('Failed to fetch products by category:', error);
      return [];
    }
  }

  async getActiveProducts(): Promise<Product[]> {
    try {
      const products = await this.getProducts();
      // Since API Product doesn't have isActive, return all products
      return products;
    } catch (error) {
      console.error('Failed to fetch active products:', error);
      return [];
    }
  }

  private getDefaultProducts(): Product[] {
    return [
      {
        id: 'spraying-default',
        name: 'Drone Spraying',
        description: 'Professional drone spraying services with tiered pricing',
        category: 'spraying',
        pricingType: 'tiered',
        baseRate: 200,
        discountThreshold: 50, // Reduced from 100 to 50 hectares
        discountRate: 0.15,
        sku: 'SP_200',
        unit: 'L/ha',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tiers: [
          { productId: 'spraying-default', threshold: 40, rate: 200 },
          { productId: 'spraying-default', threshold: 80, rate: 300 },
          { productId: 'spraying-default', threshold: 160, rate: 400 }
        ]
      },
      {
        id: 'granular-default',
        name: 'Granular Application',
        description: 'Precision granular fertilizer and seed application',
        category: 'granular',
        pricingType: 'tiered',
        baseRate: 250,
        discountThreshold: 50, // Reduced from 100 to 50 hectares
        discountRate: 0.15,
        sku: 'GR_250',
        unit: 'kg/ha',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tiers: [
          { productId: 'granular-default', threshold: 50, rate: 250 },
          { productId: 'granular-default', threshold: 100, rate: 350 },
          { productId: 'granular-default', threshold: 200, rate: 450 }
        ]
      },
      {
        id: 'travelling-default',
        name: 'Travel Charges',
        description: 'Transportation costs to and from job sites',
        category: 'travelling',
        pricingType: 'per_km',
        baseRate: 15,
        discountThreshold: 200,
        discountRate: 0.10,
        sku: 'TR_15',
        unit: 'km',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'imaging-default',
        name: 'Aerial Imaging',
        description: 'High-resolution aerial photography and mapping services',
        category: 'imaging',
        pricingType: 'flat',
        baseRate: 500,
        sku: 'IM_500',
        unit: 'ha',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

export const productStorageService = new ProductStorageService();