import type { Toast } from '../hooks/useToasts'

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === 'error' ? 'alert' : 'status'}
          className={`toast-in pointer-events-auto flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.kind === 'error' ? 'bg-red-600 text-white' : 'bg-ink text-white'
          }`}
        >
          <span>{toast.text}</span>
          <button type="button" aria-label="Dismiss" onClick={() => onDismiss(toast.id)} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
