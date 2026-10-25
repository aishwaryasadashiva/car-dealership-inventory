import { useState } from 'react'
import { Modal } from './Modal'

type Props = { title: string; message: string; confirmLabel: string; onConfirm: () => Promise<void>; onClose: () => void }

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal label={title} onClose={onClose}>
      <div className="p-6 sm:p-8">
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 font-semibold hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirm}
            className="rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
