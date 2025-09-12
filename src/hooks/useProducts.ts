import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { productsService, Product, ProductFilters } from '@/api/services/products.service';

interface UseProductsOptions {
  initialFilters?: ProductFilters;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const { initialFilters = {} } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);

  const fetchProducts = useCallback(async (
    currentFilters = filters,
    showRefreshing = false
  ) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await productsService.getAll(currentFilters);
      setProducts(response || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  const refresh = useCallback(() => {
    fetchProducts(filters, true);
  }, [fetchProducts, filters]);

  const updateFilters = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
  }, []);

  const addProductToList = useCallback((newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  }, []);

  const updateProductInList = useCallback((updatedProduct: Product) => {
    setProducts(prev =>
      prev.map(product => product.id === updatedProduct.id ? updatedProduct : product)
    );
  }, []);

  const removeProductFromList = useCallback((productId: string) => {
    setProducts(prev => prev.filter(product => product.id !== productId));
  }, []);

  useEffect(() => {
    fetchProducts(filters);
  }, [filters]);

  return {
    // State
    products,
    loading,
    error,
    refreshing,
    filters,
    
    // Actions
    fetchProducts,
    refresh,
    updateFilters,
    addProductToList,
    updateProductInList,
    removeProductFromList,
  };
};
