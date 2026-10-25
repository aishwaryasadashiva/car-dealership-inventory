import { useCallback, useEffect, useState } from 'react'
import * as api from '../api'
import { ApiError } from '../api/client'
import type { SearchFilters, Vehicle } from '../types'
import { useDebounced } from './useDebounced'

type Snapshot = { key: string; all: Vehicle[]; results: Vehicle[]; error: string }

/**
 * Loads the full inventory (for stats and category chips) plus the filtered
 * results from the backend search endpoint.
 *
 * - typing is debounced so we do not call the API on every keystroke
 * - a response is only applied if it still matches the latest request
 *   (cancelled flag), so a slow older request can never overwrite a newer one
 * - `loading` is derived (snapshot key !== request key), and the previous data
 *   stays on screen while the next request is in flight
 */
export function useInventory(token: string, filters: SearchFilters, onUnauthorized: () => void) {
  const debounced = useDebounced(filters, 300)
  const [version, setVersion] = useState(0)
  const [snapshot, setSnapshot] = useState<Snapshot>({ key: '', all: [], results: [], error: '' })

  const requestKey = `${token}|${version}|${JSON.stringify(debounced)}`

  useEffect(() => {
    let cancelled = false

    Promise.all([api.listVehicles(token), api.searchVehicles(token, debounced)])
      .then(([all, results]) => {
        if (!cancelled) setSnapshot({ key: requestKey, all, results, error: '' })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) return onUnauthorized()
        const error = err instanceof Error ? err.message : 'Could not load vehicles'
        setSnapshot((previous) => ({ ...previous, key: requestKey, error }))
      })

    return () => {
      cancelled = true
    }
  }, [requestKey, token, debounced, onUnauthorized])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return {
    all: snapshot.all,
    results: snapshot.results,
    error: snapshot.error,
    loading: snapshot.key !== requestKey,
    reload,
  }
}
