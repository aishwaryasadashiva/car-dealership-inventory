import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api'
import type { User, Vehicle } from '../types'
import { Dashboard } from './Dashboard'

vi.mock('../api')

const car = (id: number, model: string, quantity: number, category = 'SUV'): Vehicle => ({
  id,
  make: 'Tata',
  model,
  category,
  price: 900_000 + id,
  quantity_in_stock: quantity,
  image_url: 'https://example.com/car.jpg',
})

const NEXON = car(1, 'Nexon', 4)
const PUNCH = car(2, 'Punch', 0, 'Hatchback')

const customer: User = { id: 1, email: 'c@example.com', is_admin: false }
const admin: User = { id: 2, email: 'a@example.com', is_admin: true }

function renderDashboard(user: User, onSessionExpired = vi.fn()) {
  return render(<Dashboard token="t" user={user} onLogout={vi.fn()} onSessionExpired={onSessionExpired} />)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.listVehicles).mockResolvedValue([NEXON, PUNCH])
  vi.mocked(api.searchVehicles).mockResolvedValue([NEXON, PUNCH])
})

describe('Dashboard', () => {
  it('lists every vehicle from the API', async () => {
    renderDashboard(customer)

    expect(await screen.findByRole('heading', { name: 'Nexon' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Punch' })).toBeInTheDocument()
  })

  it('disables Purchase only on the sold-out car', async () => {
    renderDashboard(customer)
    await screen.findByRole('heading', { name: 'Nexon' })

    expect(screen.getByRole('button', { name: 'Purchase' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled()
  })

  it('hides every admin control from customers', async () => {
    renderDashboard(customer)
    await screen.findByRole('heading', { name: 'Nexon' })

    expect(screen.queryByRole('button', { name: /add vehicle/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^edit/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Inventory value')).not.toBeInTheDocument()
  })

  it('shows admins the add, edit, restock and delete controls', async () => {
    renderDashboard(admin)
    await screen.findByRole('heading', { name: 'Nexon' })

    expect(screen.getByRole('button', { name: /add vehicle/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Nexon' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restock Nexon' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Nexon' })).toBeInTheDocument()
    expect(screen.getByText('Inventory value')).toBeInTheDocument()
  })

  it('purchases a vehicle, announces it, and reloads the stock', async () => {
    vi.mocked(api.purchaseVehicle).mockResolvedValue({ ...NEXON, quantity_in_stock: 3 })
    renderDashboard(customer)
    await screen.findByRole('heading', { name: 'Nexon' })

    await userEvent.click(screen.getByRole('button', { name: 'Purchase' }))

    expect(api.purchaseVehicle).toHaveBeenCalledWith('t', 1)
    expect(await screen.findByText(/You bought a Tata Nexon/)).toBeInTheDocument()
    await waitFor(() => expect(api.listVehicles).toHaveBeenCalledTimes(2))
  })

  it('shows the server message when a purchase fails', async () => {
    vi.mocked(api.purchaseVehicle).mockRejectedValue(new Error('Vehicle is out of stock'))
    renderDashboard(customer)
    await screen.findByRole('heading', { name: 'Nexon' })

    await userEvent.click(screen.getByRole('button', { name: 'Purchase' }))

    expect(await screen.findByText('Vehicle is out of stock')).toBeInTheDocument()
  })

  it('sends the search text to the backend search endpoint', async () => {
    renderDashboard(customer)
    await screen.findByRole('heading', { name: 'Nexon' })

    await userEvent.type(screen.getByLabelText('Search vehicles'), 'nex')

    await waitFor(() =>
      expect(api.searchVehicles).toHaveBeenLastCalledWith('t', expect.objectContaining({ q: 'nex' })),
    )
  })

  it('filters by category chip through the backend', async () => {
    renderDashboard(customer)
    await screen.findByRole('heading', { name: 'Nexon' })

    await userEvent.click(screen.getByRole('button', { name: 'Hatchback' }))

    await waitFor(() =>
      expect(api.searchVehicles).toHaveBeenLastCalledWith('t', expect.objectContaining({ category: 'Hatchback' })),
    )
  })

  it('shows an empty state when nothing matches', async () => {
    renderDashboard(customer)
    await screen.findByRole('heading', { name: 'Nexon' })
    vi.mocked(api.searchVehicles).mockResolvedValue([])

    await userEvent.type(screen.getByLabelText('Search vehicles'), 'zzz')

    expect(await screen.findByText('No vehicles match')).toBeInTheDocument()
  })

  it('asks for confirmation before deleting, then deletes', async () => {
    vi.mocked(api.deleteVehicle).mockResolvedValue({ message: 'ok' })
    renderDashboard(admin)
    await screen.findByRole('heading', { name: 'Nexon' })

    await userEvent.click(screen.getByRole('button', { name: 'Delete Nexon' }))
    expect(api.deleteVehicle).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('dialog', { name: 'Delete this vehicle?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(api.deleteVehicle).toHaveBeenCalledWith('t', 1))
  })

  it('lets an admin add a vehicle', async () => {
    vi.mocked(api.createVehicle).mockResolvedValue(car(3, 'Harrier', 2))
    renderDashboard(admin)
    await screen.findByRole('heading', { name: 'Nexon' })

    await userEvent.click(screen.getByRole('button', { name: /add vehicle/i }))
    const dialog = await screen.findByRole('dialog', { name: 'Add vehicle' })
    await userEvent.type(within(dialog).getByLabelText('Make'), 'Tata')
    await userEvent.type(within(dialog).getByLabelText('Model'), 'Harrier')
    await userEvent.type(within(dialog).getByLabelText('Category'), 'SUV')
    await userEvent.type(within(dialog).getByLabelText('Price (₹)'), '1500000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add vehicle' }))

    await waitFor(() =>
      expect(api.createVehicle).toHaveBeenCalledWith('t', {
        make: 'Tata',
        model: 'Harrier',
        category: 'SUV',
        price: 1_500_000,
        quantity_in_stock: 1,
        image_url: null,
      }),
    )
  })

  it('shows the EMI estimate in the details drawer', async () => {
    renderDashboard(customer)
    await screen.findByRole('heading', { name: 'Nexon' })

    await userEvent.click(screen.getAllByRole('button', { name: 'Details' })[0])

    const dialog = await screen.findByRole('dialog', { name: /Nexon details/ })
    expect(within(dialog).getByTestId('emi-monthly')).toHaveTextContent(/₹/)
  })

  it('lets an admin restock a sold-out car', async () => {
    vi.mocked(api.restockVehicle).mockResolvedValue({ ...PUNCH, quantity_in_stock: 5 })
    renderDashboard(admin)
    await screen.findByRole('heading', { name: 'Punch' })

    await userEvent.click(screen.getByRole('button', { name: 'Restock Punch' }))
    const dialog = await screen.findByRole('dialog', { name: 'Restock vehicle' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add stock' }))

    await waitFor(() => expect(api.restockVehicle).toHaveBeenCalledWith('t', 2, 5))
  })

  it('returns to the login screen when the session has expired', async () => {
    const { ApiError } = await vi.importActual<typeof import('../api/client')>('../api/client')
    const onSessionExpired = vi.fn()
    vi.mocked(api.listVehicles).mockRejectedValue(new ApiError(401, 'Invalid or expired access token'))

    renderDashboard(customer, onSessionExpired)

    await waitFor(() => expect(onSessionExpired).toHaveBeenCalled())
  })
})
