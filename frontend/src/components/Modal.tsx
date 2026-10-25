import { useEffect, useRef, type ReactNode } from 'react'

type Props = { label: string; onClose: () => void; children: ReactNode; variant?: 'center' | 'drawer' }

/**
 * Thin wrapper around the native <dialog>: the browser provides the focus
 * trap, Escape-to-close and the backdrop, so none of that is re-implemented.
 * Mount it to open it, unmount it to close it.
 */
export function Modal({ label, onClose, children, variant = 'center' }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const layout =
    variant === 'drawer'
      ? 'ml-auto mr-0 my-0 h-dvh max-h-dvh w-full max-w-md rounded-l-3xl'
      : 'm-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl'

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className={`${layout} overflow-y-auto bg-white p-0 text-ink shadow-2xl`}
    >
      {children}
    </dialog>
  )
}
