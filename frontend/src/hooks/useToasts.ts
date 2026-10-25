import { useCallback, useState } from 'react'

export type Toast = { id: number; kind: 'success' | 'error'; text: string }

let nextId = 1

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (kind: Toast['kind'], text: string) => {
      const id = nextId++
      setToasts((current) => [...current, { id, kind, text }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  return { toasts, push, dismiss }
}
