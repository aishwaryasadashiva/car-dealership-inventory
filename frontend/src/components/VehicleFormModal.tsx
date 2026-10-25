import { useState, type FormEvent } from 'react'
import type { Vehicle, VehicleInput } from '../types'
import { Modal } from './Modal'

type Props = {
  vehicle: Vehicle | null // null = adding a new vehicle
  categories: string[]
  onSubmit: (data: VehicleInput) => Promise<void>
  onClose: () => void
}

const input = 'mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 outline-ember focus:border-ember'

export function VehicleFormModal({ vehicle, categories, onSubmit, onClose }: Props) {
  const [make, setMake] = useState(vehicle?.make ?? '')
  const [model, setModel] = useState(vehicle?.model ?? '')
  const [category, setCategory] = useState(vehicle?.category ?? '')
  const [price, setPrice] = useState(vehicle ? String(vehicle.price) : '')
  const [quantity, setQuantity] = useState(vehicle ? String(vehicle.quantity_in_stock) : '1')
  const [imageUrl, setImageUrl] = useState(vehicle?.image_url ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit({
        make: make.trim(),
        model: model.trim(),
        category: category.trim(),
        price: Number(price),
        quantity_in_stock: Number(quantity),
        image_url: imageUrl.trim() || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the vehicle')
      setBusy(false)
    }
  }

  return (
    <Modal label={vehicle ? 'Edit vehicle' : 'Add vehicle'} onClose={onClose}>
      <form onSubmit={submit} className="p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">{vehicle ? `Edit ${vehicle.make} ${vehicle.model}` : 'Add a vehicle'}</h2>
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Make
            <input required maxLength={100} value={make} onChange={(e) => setMake(e.target.value)} className={input} />
          </label>
          <label className="text-sm font-semibold">
            Model
            <input required maxLength={100} value={model} onChange={(e) => setModel(e.target.value)} className={input} />
          </label>
          <label className="text-sm font-semibold">
            Category
            <input required maxLength={50} list="category-options" value={category} onChange={(e) => setCategory(e.target.value)} className={input} />
            <datalist id="category-options">
              {categories.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          <label className="text-sm font-semibold">
            Price (₹)
            <input required type="number" min="1" step="any" value={price} onChange={(e) => setPrice(e.target.value)} className={input} />
          </label>
          <label className="text-sm font-semibold">
            Quantity in stock
            <input required type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={input} />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Photo URL <span className="font-normal text-slate-500">(optional - a photo is found automatically)</span>
            <input type="url" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={input} />
          </label>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 font-semibold hover:bg-slate-100">
            Cancel
          </button>
          <button disabled={busy} className="rounded-xl bg-ember px-5 py-2.5 font-bold text-white hover:bg-ember-dark disabled:opacity-60">
            {busy ? 'Saving…' : vehicle ? 'Save changes' : 'Add vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
