import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Vehicle } from '../types'
import { VehicleCard } from './VehicleCard'

const vehicle: Vehicle = {
  id: 7,
  make: 'Tata',
  model: 'Nexon',
  category: 'SUV',
  price: 899_000,
  quantity_in_stock: 5,
  image_url: 'https://example.com/nexon.jpg',
}

function setup(overrides: Partial<Vehicle> = {}, isAdmin = false) {
  const handlers = {
    onPurchase: vi.fn(),
    onDetails: vi.fn(),
    onEdit: vi.fn(),
    onRestock: vi.fn(),
    onDelete: vi.fn(),
  }
  render(
    <VehicleCard
      vehicle={{ ...vehicle, ...overrides }}
      isAdmin={isAdmin}
      purchasing={false}
      {...handlers}
    />,
  )
  return handlers
}

describe('VehicleCard', () => {
  it('shows make, model, category and price', () => {
    setup()

    expect(screen.getByRole('heading', { name: 'Nexon' })).toBeInTheDocument()
    expect(screen.getByText('Tata')).toBeInTheDocument()
    expect(screen.getByText('SUV')).toBeInTheDocument()
    expect(screen.getByText(/8,99,000/)).toBeInTheDocument()
  })

  it('lets a customer purchase when the car is in stock', async () => {
    const { onPurchase } = setup()

    await userEvent.click(screen.getByRole('button', { name: /purchase/i }))

    expect(onPurchase).toHaveBeenCalledWith(vehicle)
  })

  it('disables Purchase when the quantity is zero', async () => {
    const { onPurchase } = setup({ quantity_in_stock: 0 })

    const button = screen.getByRole('button', { name: /sold out/i })
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onPurchase).not.toHaveBeenCalled()
  })

  it('warns when only a few units are left', () => {
    setup({ quantity_in_stock: 2 })

    expect(screen.getByText('Only 2 left')).toBeInTheDocument()
  })

  it('hides admin controls from customers', () => {
    setup()

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /restock/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('shows edit, restock and delete to admins and wires them up', async () => {
    const { onEdit, onRestock, onDelete } = setup({}, true)

    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    await userEvent.click(screen.getByRole('button', { name: /restock/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete/i }))

    expect(onEdit).toHaveBeenCalledWith(vehicle)
    expect(onRestock).toHaveBeenCalledWith(vehicle)
    expect(onDelete).toHaveBeenCalledWith(vehicle)
  })

  it('opens the details view', async () => {
    const { onDetails } = setup()

    await userEvent.click(screen.getByRole('button', { name: /details/i }))

    expect(onDetails).toHaveBeenCalledWith(vehicle)
  })
})
