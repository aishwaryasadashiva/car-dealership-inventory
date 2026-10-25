import { useState, type FormEvent } from 'react'
import type { Vehicle } from '../types'
import { CarPhoto } from './CarPhoto'
import { Logo } from './Logo'

type Props = {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
  notice?: string
}

const SHOWCASE: Vehicle = {
  id: 0,
  make: 'Mahindra',
  model: 'Thar',
  category: 'SUV',
  price: 0,
  quantity_in_stock: 0,
  image_url: null,
}

const POINTS = [
  'Live stock - sold-out cars are clearly marked',
  'Search by make, model, category and price',
  'EMI calculator on every vehicle',
]

export function AuthScreen({ onSignIn, onSignUp, notice }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const isLogin = mode === 'login'

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await (isLogin ? onSignIn(email, password) : onSignUp(email, password))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setBusy(false)
    }
  }

  function switchMode() {
    setMode(isLogin ? 'register' : 'login')
    setError('')
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink lg:block">
        <CarPhoto vehicle={SHOWCASE} className="absolute inset-0 h-full opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo />
          <div>
            <h1 className="font-display max-w-md text-5xl leading-[1.05] font-bold">
              Your next drive is <span className="text-ember">already on the lot.</span>
            </h1>
            <ul className="mt-8 space-y-3 text-white/80">
              {POINTS.map((point) => (
                <li key={point} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h2 className="font-display text-3xl font-bold">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-slate-600">
            {isLogin ? 'Sign in to browse and buy from live inventory.' : 'Register to start exploring the inventory.'}
          </p>

          {notice && !error && (
            <p role="status" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <label htmlFor="email" className="mt-6 block text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 outline-ember focus:border-ember"
          />

          <label htmlFor="password" className="mt-4 block text-sm font-semibold">
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-line bg-white py-3 pr-16 pl-4 outline-ember focus:border-ember"
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-3 text-xs font-semibold text-slate-500 hover:text-ink"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {!isLogin && <p className="mt-1.5 text-xs text-slate-500">At least 8 characters.</p>}

          <button
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-ink px-4 py-3.5 font-bold text-white transition hover:bg-ink-2 disabled:opacity-60"
          >
            {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isLogin ? 'New to DriveSpace?' : 'Already registered?'}{' '}
            <button type="button" onClick={switchMode} className="font-bold text-ember hover:underline">
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </form>
      </section>
    </main>
  )
}
