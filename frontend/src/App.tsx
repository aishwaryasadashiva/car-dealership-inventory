
import { useCallback, useEffect, useMemo, useState } from 'react'

const API = 'http://127.0.0.1:8000/api'

type Vehicle = {
  id: number
  make: string
  model: string
  category: string
  price: number
  quantity_in_stock: number
}

type User = { id: number; email: string }

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

async function apiRequest<T>(
  path: string,
  token?: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = body?.detail
    throw new Error(
      typeof detail === 'string' ? detail : `Request failed (${response.status})`,
    )
  }

  return response.json() as Promise<T>
}

function App() {
  const [token, setToken] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [maxPrice, setMaxPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadVehicles = useCallback(async (accessToken: string) => {
    setLoading(true)
    try {
      const data = await apiRequest<Vehicle[]>('/vehicles', accessToken)
      setVehicles(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load vehicles')
    } finally {
      setLoading(false)
    }
  }, [])

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (authMode === 'register') {
        await apiRequest<User>('/auth/register', undefined, {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        setMessage('Registration successful. Please log in.')
        setAuthMode('login')
        setPassword('')
      } else {
        const form = new URLSearchParams()
        form.set('username', email)
        form.set('password', password)

        const response = await fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => null)
          throw new Error(
            typeof body?.detail === 'string'
              ? body.detail
              : 'Login failed. Check your credentials.',
          )
        }

        const result: { access_token: string } = await response.json()
        setToken(result.access_token)
        setUser({ id: 0, email })
        await loadVehicles(result.access_token)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  async function purchaseVehicle(id: number) {
    if (!token) return
    setError('')
    setMessage('')

    try {
      await apiRequest<Vehicle>(`/vehicles/${id}/purchase`, token, {
        method: 'POST',
      })
      setMessage('Purchase completed successfully.')
      await loadVehicles(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed')
    }
  }

  function logout() {
    setToken('')
    setUser(null)
    setVehicles([])
    setPassword('')
    setMessage('')
    setError('')
  }

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((vehicle) => {
        const matchesSearch =
          `${vehicle.make} ${vehicle.model} ${vehicle.category}`
            .toLowerCase()
            .includes(search.trim().toLowerCase())

        const matchesCategory =
          category === 'All' || vehicle.category === category

        const matchesPrice =
          maxPrice === '' || vehicle.price <= Number(maxPrice)

        return matchesSearch && matchesCategory && matchesPrice
      }),
    [vehicles, search, category, maxPrice],
  )

  const availableCount = vehicles.filter(
    (vehicle) => vehicle.quantity_in_stock > 0,
  ).length

  if (!token || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 text-slate-900">
        <form
          onSubmit={handleAuth}
          className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
            DriveSpace
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {authMode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="mt-2 text-slate-500">
            {authMode === 'login'
              ? 'Log in to explore the vehicle inventory.'
              : 'Register to access the vehicle inventory.'}
          </p>

          {message && (
            <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <label className="mt-6 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="mt-4 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading
              ? 'Please wait…'
              : authMode === 'login'
                ? 'Log in'
                : 'Register'}
          </button>

          <p className="mt-5 text-center text-sm text-slate-600">
            {authMode === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}{' '}
            <button
              type="button"
              className="font-semibold text-blue-700"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login')
                setError('')
                setMessage('')
              }}
            >
              {authMode === 'login' ? 'Register' : 'Log in'}
            </button>
          </p>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              DriveSpace
            </p>
            <h1 className="mt-1 text-2xl font-bold">Vehicle Inventory</h1>
          </div>
          <button
            onClick={logout}
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {message && (
          <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total vehicle models</p>
            <p className="mt-2 text-3xl font-bold">{vehicles.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Models in stock</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{availableCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Units available</p>
            <p className="mt-2 text-3xl font-bold">
              {vehicles.reduce((total, vehicle) => total + vehicle.quantity_in_stock, 0)}
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold">Available vehicles</h2>
              <p className="mt-1 text-sm text-slate-500">
                Search the inventory and explore available models.
              </p>
            </div>
            <span className="text-sm text-slate-500">
              {filteredVehicles.length} results
            </span>
          </div>

          <div className="mt-5 grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-3">
            <input
              aria-label="Search vehicles"
              className="rounded-xl border border-slate-200 px-4 py-3"
              placeholder="Search make, model or category..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              aria-label="Filter by category"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>All</option>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Hatchback</option>
            </select>
            <input
              aria-label="Maximum price"
              type="number"
              min="0"
              className="rounded-xl border border-slate-200 px-4 py-3"
              placeholder="Maximum price (₹)"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </div>

          {loading && <p className="mt-5 text-slate-600">Loading inventory…</p>}

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVehicles.map((vehicle) => (
              <article
                key={vehicle.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100">
                  <span className="text-6xl" aria-hidden="true">🚘</span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{vehicle.make}</p>
                      <h3 className="mt-1 text-xl font-bold">{vehicle.model}</h3>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                      {vehicle.category}
                    </span>
                  </div>
                  <p className="mt-4 text-2xl font-bold text-blue-700">
                    {money(vehicle.price)}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span
                      className={`text-sm font-medium ${
                        vehicle.quantity_in_stock > 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {vehicle.quantity_in_stock > 0
                        ? `${vehicle.quantity_in_stock} in stock`
                        : 'Out of stock'}
                    </span>
                    <button
                      disabled={vehicle.quantity_in_stock === 0 || loading}
                      onClick={() => purchaseVehicle(vehicle.id)}
                      className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Purchase
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!loading && filteredVehicles.length === 0 && !error && (
            <div className="mt-5 rounded-2xl bg-white p-10 text-center">
              <p className="font-semibold">No matching vehicles found</p>
              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
