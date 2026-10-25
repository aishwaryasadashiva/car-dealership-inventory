import type { User } from '../types'
import { Logo } from './Logo'

type Props = { user: User; onLogout: () => void; onAdd: () => void }

export function Header({ user, onLogout, onAdd }: Props) {
  return (
    <header className="sticky top-0 z-30 bg-ink/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${
              user.is_admin ? 'bg-ember text-white' : 'bg-white/10 text-white/80'
            }`}
          >
            {user.is_admin ? 'Admin' : 'Customer'}
          </span>
          <span className="hidden max-w-[16rem] truncate text-sm text-white/70 md:inline">{user.email}</span>
          {user.is_admin && (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-ink hover:bg-slate-200"
            >
              + Add vehicle
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}
