import { useState, type FormEvent } from 'react'
import type { Vehicle } from '../types'
import { Modal } from './Modal'

type Props = { vehicle: Vehicle; onSubmit: (quantity: number) => Promise<void>; onClose: () => void }

export function RestockModal({ vehicle, onSubmit, onClose }: Props) {
  const [quantity, setQuantity] = useState('5')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit(Number(quantity))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restock')
      setBusy(false)
    }
  }

  return (
    <Modal label="Restock vehicle" onClose={onClose}>
      <form onSubmit={submit} className="p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">Restock {vehicle.make} {vehicle.model}</h2>
        <p className="mt-1 text-slate-600">Currently {vehicle.quantity_in_stock} in stock.</p>
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <label className="mt-5 block text-sm font-semibold">
          Units to add
          <input
            required
            autoFocus
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 outline-ember focus:border-ember"
          />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 font-semibold hover:bg-slate-100">
            Cancel
          </button>
          <button disabled={busy} className="rounded-xl bg-ink px-5 py-2.5 font-bold text-white hover:bg-ink-2 disabled:opacity-60">
            {busy ? 'Adding…' : 'Add stock'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
