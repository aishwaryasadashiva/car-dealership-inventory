import { calculateEmi } from '../lib/emi'
import { formatPrice, formatPriceShort, stockLabel } from '../lib/format'
import type { Vehicle } from '../types'
import { CarPhoto } from './CarPhoto'

type Props = {
  vehicle: Vehicle
  isAdmin: boolean
  purchasing: boolean
  onPurchase: (vehicle: Vehicle) => void
  onDetails: (vehicle: Vehicle) => void
  onEdit: (vehicle: Vehicle) => void
  onRestock: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
}

const TONE = {
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  low: 'bg-amber-50 text-amber-800 ring-amber-200',
  out: 'bg-red-50 text-red-700 ring-red-200',
} as const

// Indicative EMI shown on every card: 20% down, 9% p.a., 60 months.
const indicativeEmi = (price: number) =>
  calculateEmi({ price, downPayment: price * 0.2, annualRate: 9, months: 60 }).monthly

export function VehicleCard({
  vehicle,
  isAdmin,
  purchasing,
  onPurchase,
  onDetails,
  onEdit,
  onRestock,
  onDelete,
}: Props) {
  const stock = stockLabel(vehicle.quantity_in_stock)
  const soldOut = vehicle.quantity_in_stock <= 0

  return (
    <article className="group fade-up flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative">
        <CarPhoto vehicle={vehicle} className="aspect-[16/10]" />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-ink shadow">
          {vehicle.category}
        </span>
        {soldOut && <div className="absolute inset-0 bg-ink/55" aria-hidden="true" />}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">{vehicle.make}</p>
        <h3 className="font-display mt-1 text-2xl font-bold text-ink">{vehicle.model}</h3>

        <p className="mt-4 text-2xl font-bold text-ink" title={formatPriceShort(vehicle.price)}>
          {formatPrice(vehicle.price)}
        </p>
        <p className="text-xs text-slate-500">EMI from ~{formatPrice(Math.round(indicativeEmi(vehicle.price)))}/mo</p>

        <div className="mt-4 flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${TONE[stock.tone]}`}>
            {stock.text}
          </span>
          <button
            type="button"
            onClick={() => onDetails(vehicle)}
            className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
          >
            Details
          </button>
        </div>

        <button
          type="button"
          disabled={soldOut || purchasing}
          onClick={() => onPurchase(vehicle)}
          className="mt-4 w-full rounded-xl bg-ember px-4 py-3 text-sm font-bold text-white transition hover:bg-ember-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {soldOut ? 'Sold out' : purchasing ? 'Processing…' : 'Purchase'}
        </button>

        {isAdmin && (
          <div className="mt-3 flex gap-2 border-t border-line pt-3 text-xs font-semibold">
            <button
              type="button"
              aria-label={`Edit ${vehicle.model}`}
              onClick={() => onEdit(vehicle)}
              className="flex-1 rounded-lg bg-slate-100 px-2 py-2 hover:bg-slate-200"
            >
              Edit
            </button>
            <button
              type="button"
              aria-label={`Restock ${vehicle.model}`}
              onClick={() => onRestock(vehicle)}
              className="flex-1 rounded-lg bg-slate-100 px-2 py-2 hover:bg-slate-200"
            >
              Restock
            </button>
            <button
              type="button"
              aria-label={`Delete ${vehicle.model}`}
              onClick={() => onDelete(vehicle)}
              className="flex-1 rounded-lg bg-red-50 px-2 py-2 text-red-700 hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
