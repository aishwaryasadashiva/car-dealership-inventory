import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearPhotoCache, resolveCarPhoto } from './photo'

const wikipediaReply = {
  query: {
    pages: {
      '123': {
        title: 'Tata Nexon',
        thumbnail: { source: 'https://upload.wikimedia.org/nexon.jpg' },
      },
    },
  },
}

function mockFetch(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: async () => body })
}

describe('resolveCarPhoto', () => {
  beforeEach(() => {
    clearPhotoCache()
    sessionStorage.clear()
  })

  it('returns the article thumbnail and a link back to the source page', async () => {
    const fetcher = mockFetch(wikipediaReply)

    const photo = await resolveCarPhoto('Tata Nexon', fetcher)

    expect(photo).toEqual({
      url: 'https://upload.wikimedia.org/nexon.jpg',
      sourceUrl: 'https://en.wikipedia.org/wiki/Tata_Nexon',
    })
    expect(fetcher.mock.calls[0][0]).toContain('origin=*')
    expect(fetcher.mock.calls[0][0]).toContain(encodeURIComponent('Tata Nexon'))
  })

  it('looks each car up only once', async () => {
    const fetcher = mockFetch(wikipediaReply)

    await resolveCarPhoto('Tata Nexon', fetcher)
    await resolveCarPhoto('tata nexon', fetcher)

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('returns null when the article has no image', async () => {
    const fetcher = mockFetch({ query: { pages: { '1': { title: 'Nothing' } } } })

    expect(await resolveCarPhoto('Nothing', fetcher)).toBeNull()
  })

  it('returns null when nothing matches at all', async () => {
    expect(await resolveCarPhoto('zzzz', mockFetch({}))).toBeNull()
  })

  it('returns null instead of throwing when the network fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'))

    expect(await resolveCarPhoto('Tata Nexon', fetcher)).toBeNull()
  })

  it('returns null for a non-ok response', async () => {
    expect(await resolveCarPhoto('Tata Nexon', mockFetch({}, false))).toBeNull()
  })
})
