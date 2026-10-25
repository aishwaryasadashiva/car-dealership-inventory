export type Vehicle = {
  id: number
  make: string
  model: string
  category: string
  price: number
  quantity_in_stock: number
  image_url: string | null
}

/** What the admin form edits (everything except the server-assigned id). */
export type VehicleInput = Omit<Vehicle, 'id'>

export type User = { id: number; email: string; is_admin: boolean }

export type SearchFilters = {
  q: string
  category: string
  minPrice: string
  maxPrice: string
  inStockOnly: boolean
}
