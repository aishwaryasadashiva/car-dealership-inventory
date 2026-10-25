import type { SearchFilters, User, Vehicle, VehicleInput } from '../types'
import { request } from './client'

export const register = (email: string, password: string) =>
  request<User>('/auth/register', { method: 'POST', json: { email, password } })

export const login = (email: string, password: string) =>
  request<{ access_token: string }>('/auth/login', {
    method: 'POST',
    form: { username: email, password },
  })

export const fetchMe = (token: string) => request<User>('/auth/me', { token })

export const listVehicles = (token: string) => request<Vehicle[]>('/vehicles', { token })

export const searchVehicles = (token: string, filters: SearchFilters) =>
  request<Vehicle[]>('/vehicles/search', {
    token,
    query: {
      q: filters.q.trim(),
      category: filters.category === 'All' ? undefined : filters.category,
      min_price: filters.minPrice,
      max_price: filters.maxPrice,
      in_stock: filters.inStockOnly || undefined,
    },
  })

export const createVehicle = (token: string, data: VehicleInput) =>
  request<Vehicle>('/vehicles', { token, method: 'POST', json: data })

export const updateVehicle = (token: string, id: number, data: VehicleInput) =>
  request<Vehicle>(`/vehicles/${id}`, { token, method: 'PUT', json: data })

export const deleteVehicle = (token: string, id: number) =>
  request<{ message: string }>(`/vehicles/${id}`, { token, method: 'DELETE' })

export const purchaseVehicle = (token: string, id: number) =>
  request<Vehicle>(`/vehicles/${id}/purchase`, { token, method: 'POST' })

export const restockVehicle = (token: string, id: number, quantity: number) =>
  request<Vehicle>(`/vehicles/${id}/restock`, { token, method: 'POST', json: { quantity } })
