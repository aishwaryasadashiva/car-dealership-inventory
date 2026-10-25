import { useState } from 'react'
import { calculateEmi } from '../lib/emi'
import { formatPrice, stockLabel } from '../lib/format'
import type { Vehicle } from '../types'
import { CarPhoto } from './CarPhoto'
import { Modal } from './Modal'

type Props = {
  vehicle: Vehicle
  purchasing: boolean
  onPurchase: (vehicle: Vehicle) => void
  onClose: () => void
}

const TENURES = [12, 24, 36, 48, 60, 72, 84]

export function DetailsDrawer({ vehicle, purchasing, onPurchase, onClose }: Props) {
  const [downPercent, setDownPercent] = useState(20)
  const [rate, setRate] = useState(9)
  const [months, setMonths] = useState(60)

  const downPayment = Math.round((vehicle.price * downPercent) / 100)
  const emi = calculateEmi({ price: vehicle.price, downPayment, annualRate: rate, months })
  const interestShare = emi.totalPayable > 0 ? (emi.totalInterest / emi.totalPayable) * 100 : 0

  const stock = stockLabel(vehicle.quantity_in_stock)
  const soldOut = vehicle.quantity_in_stock <= 0

  return (
    <Modal label={`${vehicle.make} ${vehicle.model} details`} variant="drawer" onClose={onClose}>
      <div className="flex min-h-full flex-col">
        <CarPhoto vehicle={vehicle} className="aspect-[16/10] shrink-0" />

        <div className="flex-1 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">{vehicle.make}</p>
              <h2 className="font-display text-3xl font-bold">{vehicle.model}</h2>
            </div>
            <button type="button" aria-label="Close details" onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
              ✕
            </button>
          </div>

          <p className="mt-3 text-3xl font-bold">{formatPrice(vehicle.price)}</p>
          <p className="mt-1 text-sm text-slate-600">
            {vehicle.category} · {stock.text}
          </p>

          <section className="mt-6 rounded-2xl bg-paper p-5" aria-label="EMI calculator">
            <h3 className="font-display text-lg font-bold">Estimate your EMI</h3>

            <div className="mt-4 space-y-4 text-sm font-medium">
              <label className="block">
                <span className="flex justify-between">
                  Down payment ({downPercent}%) <span>{formatPrice(downPayment)}</span>
                </span>
                <input type="range" min="0" max="60" step="5" value={downPercent} onChange={(e) => setDownPercent(Number(e.target.value))} className="mt-1 w-full accent-ember" />
              </label>
              <label className="block">
                <span className="flex justify-between">
                  Interest rate <span>{rate}% p.a.</span>
                </span>
                <input type="range" min="6" max="16" step="0.5" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-1 w-full accent-ember" />
              </label>
              <label className="block">
                Tenure
                <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2">
                  {TENURES.map((t) => (
                    <option key={t} value={t}>
                      {t} months ({t / 12} {t === 12 ? 'year' : 'years'})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 rounded-xl bg-ink p-4 text-white">
              <p className="text-xs tracking-wider text-white/60 uppercase">Monthly EMI</p>
              <p className="font-display text-3xl font-bold" data-testid="emi-monthly">
                {formatPrice(Math.round(emi.monthly))}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
                <div className="h-full bg-ember" style={{ width: `${interestShare}%` }} />
              </div>
              <dl className="mt-2 flex justify-between text-xs text-white/70">
                <div>
                  <dt>Interest</dt>
                  <dd className="font-semibold text-white">{formatPrice(Math.round(emi.totalInterest))}</dd>
                </div>
                <div className="text-right">
                  <dt>Total payable</dt>
                  <dd className="font-semibold text-white">{formatPrice(Math.round(emi.totalPayable + downPayment))}</dd>
                </div>
              </dl>
            </div>
            <p className="mt-3 text-xs text-slate-500">Indicative figures only - not a loan offer.</p>
          </section>
        </div>

        <div className="sticky bottom-0 border-t border-line bg-white p-4">
          <button
            type="button"
            disabled={soldOut || purchasing}
            onClick={() => onPurchase(vehicle)}
            className="w-full rounded-xl bg-ember px-4 py-3.5 font-bold text-white hover:bg-ember-dark disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {soldOut ? 'Sold out' : purchasing ? 'Processing…' : 'Purchase this vehicle'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
