import { useEffect, useState } from 'react'
import { resolveCarPhoto, type CarPhoto as Photo } from '../lib/photo'
import type { Vehicle } from '../types'
import { CarSilhouette } from './CarSilhouette'

type State = { status: 'loading' | 'ready' | 'fallback'; photo: Photo | null }

/**
 * Photo for a vehicle: the admin's own image_url if set, otherwise a real
 * photo looked up from Wikipedia, otherwise a drawn silhouette.
 */
export function CarPhoto({ vehicle, className = '' }: { vehicle: Vehicle; className?: string }) {
  const own = vehicle.image_url
  const [state, setState] = useState<State>(
    own ? { status: 'ready', photo: { url: own, sourceUrl: '' } } : { status: 'loading', photo: null },
  )

  useEffect(() => {
    if (own) return
    let cancelled = false
    resolveCarPhoto(`${vehicle.make} ${vehicle.model}`).then((photo) => {
      if (!cancelled) setState(photo ? { status: 'ready', photo } : { status: 'fallback', photo: null })
    })
    return () => {
      cancelled = true
    }
  }, [own, vehicle.make, vehicle.model])

  // An image_url edit takes effect immediately, without waiting for an effect.
  const current: State = own ? { status: 'ready', photo: { url: own, sourceUrl: '' } } : state

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-ink-2 to-ink ${className}`}>
      {current.status === 'ready' && current.photo ? (
        <>
          <img
            src={current.photo.url}
            alt={`${vehicle.make} ${vehicle.model}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            onError={() => setState({ status: 'fallback', photo: null })}
          />
          {current.photo.sourceUrl && (
            <a
              href={current.photo.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute right-2 bottom-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white/80 backdrop-blur hover:text-white"
            >
              Photo: Wikipedia
            </a>
          )}
        </>
      ) : current.status === 'loading' ? (
        <div className="shimmer h-full w-full" aria-hidden="true" />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-6 text-ember/80">
          <CarSilhouette category={vehicle.category} className="w-full max-w-[280px]" />
        </div>
      )}
    </div>
  )
}
