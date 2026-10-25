import { useCallback, useMemo, useState } from 'react'
import * as api from '../api'
import { ApiError } from '../api/client'
import { useInventory } from '../hooks/useInventory'
import { useToasts } from '../hooks/useToasts'
import { EMPTY_FILTERS, type SortKey } from '../lib/filters'
import type { SearchFilters, User, Vehicle, VehicleInput } from '../types'
import { ConfirmDialog } from './ConfirmDialog'
import { DetailsDrawer } from './DetailsDrawer'
import { FilterBar } from './FilterBar'
import { Header } from './Header'
import { RestockModal } from './RestockModal'
import { StatsBar } from './StatsBar'
import { Toasts } from './Toasts'
import { VehicleCard } from './VehicleCard'
import { VehicleFormModal } from './VehicleFormModal'

type Props = { token: string; user: User; onLogout: () => void; onSessionExpired: () => void }

const SORTERS: Record<SortKey, ((a: Vehicle, b: Vehicle) => number) | null> = {
  featured: null,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  name: (a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`),
}

export function Dashboard({ token, user, onLogout, onSessionExpired }: Props) {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<SortKey>('featured')
  const { all, results, loading, error, reload } = useInventory(token, filters, onSessionExpired)
  const { toasts, push, dismiss } = useToasts()

  const [detailsId, setDetailsId] = useState<number | null>(null)
  const [purchasingId, setPurchasingId] = useState<number | null>(null)
  const [formTarget, setFormTarget] = useState<Vehicle | 'new' | null>(null)
  const [restockTarget, setRestockTarget] = useState<Vehicle | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)

  const categories = useMemo(() => [...new Set(all.map((v) => v.category))].sort(), [all])

  const visible = useMemo(() => {
    const sorter = SORTERS[sort]
    return sorter ? [...results].sort(sorter) : results
  }, [results, sort])

  const detailsVehicle = detailsId === null ? null : (all.find((v) => v.id === detailsId) ?? null)

  /** Session expiry returns to the login screen; anything else becomes a toast. */
  const fail = useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof ApiError && err.status === 401) return onSessionExpired()
      push('error', err instanceof Error ? err.message : fallback)
    },
    [onSessionExpired, push],
  )

  async function purchase(vehicle: Vehicle) {
    setPurchasingId(vehicle.id)
    try {
      await api.purchaseVehicle(token, vehicle.id)
      push('success', `You bought a ${vehicle.make} ${vehicle.model}. Congratulations!`)
    } catch (err) {
      fail(err, 'Purchase failed')
    } finally {
      setPurchasingId(null)
      reload() // always re-sync: someone else may have bought the last unit
    }
  }

  async function saveVehicle(data: VehicleInput) {
    if (formTarget === null) return
    if (formTarget === 'new') await api.createVehicle(token, data)
    else await api.updateVehicle(token, formTarget.id, data)
    push('success', formTarget === 'new' ? 'Vehicle added.' : 'Vehicle updated.')
    setFormTarget(null)
    reload()
  }

  async function restock(quantity: number) {
    if (!restockTarget) return
    await api.restockVehicle(token, restockTarget.id, quantity)
    push('success', `Added ${quantity} units to ${restockTarget.model}.`)
    setRestockTarget(null)
    reload()
  }

  async function remove() {
    if (!deleteTarget) return
    try {
      await api.deleteVehicle(token, deleteTarget.id)
      push('success', `${deleteTarget.make} ${deleteTarget.model} removed.`)
    } catch (err) {
      fail(err, 'Could not delete')
    }
    setDeleteTarget(null)
    reload()
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header user={user} onLogout={onLogout} onAdd={() => setFormTarget('new')} />

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-8 sm:px-6">
          <p className="text-sm font-semibold tracking-[0.2em] text-ember uppercase">The showroom</p>
          <h1 className="font-display mt-2 max-w-2xl text-4xl leading-tight font-bold sm:text-5xl">
            Find your next drive.
          </h1>
          <StatsBar vehicles={all} isAdmin={user.is_admin} />
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          categories={categories}
          sort={sort}
          onSort={setSort}
          resultCount={visible.length}
        />

        {error && (
          <div role="alert" className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-red-800">
            <span>{error}</span>
            <button type="button" onClick={reload} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-bold text-white">
              Retry
            </button>
          </div>
        )}

        {loading && all.length === 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading inventory">
            {[0, 1, 2].map((n) => (
              <div key={n} className="shimmer aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className={`mt-6 grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
            {visible.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isAdmin={user.is_admin}
                purchasing={purchasingId === vehicle.id}
                onPurchase={purchase}
                onDetails={(v) => setDetailsId(v.id)}
                onEdit={setFormTarget}
                onRestock={setRestockTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
            <p className="font-display text-xl font-bold">No vehicles match</p>
            <p className="mt-1 text-slate-600">
              {all.length === 0
                ? user.is_admin
                  ? 'The lot is empty - add your first vehicle.'
                  : 'The lot is empty right now. Please check back soon.'
                : 'Try a different search or clear the filters.'}
            </p>
          </div>
        )}

        <footer className="mt-14 border-t border-line pt-6 text-xs text-slate-500">
          Photos are looked up from Wikipedia / Wikimedia Commons and belong to their contributors under free
          licences - each photo links to its source. Prices and stock are demo data.
        </footer>
      </main>

      {detailsVehicle && (
        <DetailsDrawer
          vehicle={detailsVehicle}
          purchasing={purchasingId === detailsVehicle.id}
          onPurchase={purchase}
          onClose={() => setDetailsId(null)}
        />
      )}
      {formTarget && (
        <VehicleFormModal
          vehicle={formTarget === 'new' ? null : formTarget}
          categories={categories}
          onSubmit={saveVehicle}
          onClose={() => setFormTarget(null)}
        />
      )}
      {restockTarget && <RestockModal vehicle={restockTarget} onSubmit={restock} onClose={() => setRestockTarget(null)} />}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete this vehicle?"
          message={`${deleteTarget.make} ${deleteTarget.model} will be removed from the inventory permanently.`}
          confirmLabel="Delete"
          onConfirm={remove}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
