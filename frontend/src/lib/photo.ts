/**
 * Finds a real photo of a car from Wikipedia (images are hosted on Wikimedia
 * Commons under free licences). We use the lead image of the best-matching
 * article, so every car in the inventory gets a genuine photo with no API key
 * and no images stored in this repository.
 *
 * Failure is always silent (returns null) - the UI then draws a silhouette.
 */

export type CarPhoto = { url: string; sourceUrl: string }

type Fetcher = (url: string) => Promise<Pick<Response, 'ok' | 'json'>>

const API = 'https://en.wikipedia.org/w/api.php'
const STORAGE_PREFIX = 'drivespace:photo:'
const lookups = new Map<string, Promise<CarPhoto | null>>()

export function clearPhotoCache() {
  lookups.clear()
}

const defaultFetcher: Fetcher = (url) => fetch(url)

function buildUrl(query: string) {
  return (
    `${API}?action=query&format=json&origin=*&redirects=1` +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=0&gsrlimit=1` +
    `&prop=pageimages&piprop=thumbnail&pithumbsize=900`
  )
}

async function lookup(query: string, fetcher: Fetcher): Promise<CarPhoto | null> {
  try {
    const response = await fetcher(buildUrl(query))
    if (!response.ok) return null

    const body = await response.json()
    const page = Object.values(body?.query?.pages ?? {})[0] as
      | { title?: string; thumbnail?: { source?: string } }
      | undefined
    if (!page?.thumbnail?.source || !page.title) return null

    return {
      url: page.thumbnail.source,
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURI(page.title.replace(/ /g, '_'))}`,
    }
  } catch {
    return null
  }
}

export function resolveCarPhoto(query: string, fetcher: Fetcher = defaultFetcher): Promise<CarPhoto | null> {
  const key = query.trim().toLowerCase()

  const stored = readStored(key)
  if (stored) return Promise.resolve(stored)

  let pending = lookups.get(key)
  if (!pending) {
    pending = lookup(query.trim(), fetcher).then((photo) => {
      if (photo) writeStored(key, photo)
      return photo
    })
    lookups.set(key, pending)
  }
  return pending
}

function readStored(key: string): CarPhoto | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key)
    return raw ? (JSON.parse(raw) as CarPhoto) : null
  } catch {
    return null
  }
}

function writeStored(key: string, photo: CarPhoto) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(photo))
  } catch {
    /* storage full or unavailable - the in-memory cache still works */
  }
}
