import { EMPTY_FILTERS, type SortKey } from '../lib/filters'
import type { SearchFilters } from '../types'

type Props = {
  filters: SearchFilters
  onChange: (filters: SearchFilters) => void
  categories: string[]
  sort: SortKey
  onSort: (sort: SortKey) => void
  resultCount: number
}

const field =
  'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-ember focus:border-ember'

export function FilterBar({ filters, onChange, categories, sort, onSort, resultCount }: Props) {
  const set = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) =>
    onChange({ ...filters, [key]: value })

  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_9rem_9rem_11rem]">
        <input
          type="search"
          aria-label="Search vehicles"
          placeholder="Search make, model or category…"
          value={filters.q}
          onChange={(event) => set('q', event.target.value)}
          className={field}
        />
        <input
          type="number"
          min="0"
          inputMode="numeric"
          aria-label="Minimum price"
          placeholder="Min ₹"
          value={filters.minPrice}
          onChange={(event) => set('minPrice', event.target.value)}
          className={field}
        />
        <input
          type="number"
          min="0"
          inputMode="numeric"
          aria-label="Maximum price"
          placeholder="Max ₹"
          value={filters.maxPrice}
          onChange={(event) => set('maxPrice', event.target.value)}
          className={field}
        />
        <select aria-label="Sort vehicles" value={sort} onChange={(event) => onSort(event.target.value as SortKey)} className={field}>
          <option value="featured">Sort: Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name: A to Z</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {['All', ...categories].map((category) => {
          const selected = filters.category === category
          return (
            <button
              key={category}
              type="button"
              aria-pressed={selected}
              onClick={() => set('category', category)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                selected ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          )
        })}

        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(event) => set('inStockOnly', event.target.checked)}
            className="h-4 w-4 accent-ember"
          />
          In stock only
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-slate-500" aria-live="polite">
        <span>
          {resultCount} {resultCount === 1 ? 'vehicle' : 'vehicles'} found
        </span>
        {active && (
          <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="font-semibold text-ember hover:underline">
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
