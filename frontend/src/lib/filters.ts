import type { SearchFilters } from '../types'

export type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name'

export const EMPTY_FILTERS: SearchFilters = {
  q: '',
  category: 'All',
  minPrice: '',
  maxPrice: '',
  inStockOnly: false,
}
