import { formatPriceShort } from '../lib/format'
import type { Vehicle } from '../types'

export function StatsBar({ vehicles, isAdmin }: { vehicles: Vehicle[]; isAdmin: boolean }) {
  const units = vehicles.reduce((sum, v) => sum + v.quantity_in_stock, 0)
  const inStock = vehicles.filter((v) => v.quantity_in_stock > 0).length
  const value = vehicles.reduce((sum, v) => sum + v.price * v.quantity_in_stock, 0)

  const stats = [
    { label: 'Models listed', value: String(vehicles.length) },
    { label: 'Models in stock', value: String(inStock) },
    { label: 'Units on the lot', value: String(units) },
    ...(isAdmin ? [{ label: 'Inventory value', value: formatPriceShort(value) }] : []),
  ]

  return (
    <dl className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <dt className="text-xs font-semibold tracking-wider text-white/60 uppercase">{stat.label}</dt>
          <dd className="font-display mt-1 text-3xl font-bold text-white">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}
