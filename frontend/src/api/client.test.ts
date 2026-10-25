import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './client'

function respond(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }),
  )
  return fetch as unknown as ReturnType<typeof vi.fn>
}

afterEach(() => vi.unstubAllGlobals())

describe('request', () => {
  it('sends the bearer token and returns parsed JSON', async () => {
    const fetchMock = respond(200, [{ id: 1 }])

    const result = await request('/vehicles', { token: 'abc' })

    expect(result).toEqual([{ id: 1 }])
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer abc')
  })

  it('omits empty query values and encodes the rest', async () => {
    const fetchMock = respond(200, [])

    await request('/vehicles/search', { query: { q: 'tata', category: undefined, min_price: '' } })

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/vehicles\/search\?q=tata$/)
  })

  it('sends login data as a url-encoded form', async () => {
    const fetchMock = respond(200, { access_token: 't' })

    await request('/auth/login', { method: 'POST', form: { username: 'a@b.c', password: 'pw' } })

    const init = fetchMock.mock.calls[0][1]
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect(init.body).toBe('username=a%40b.c&password=pw')
  })

  it('surfaces a plain-string error detail', async () => {
    respond(409, { detail: 'Vehicle is out of stock' })

    await expect(request('/x')).rejects.toMatchObject({ status: 409, message: 'Vehicle is out of stock' })
  })

  it('turns FastAPI validation errors into readable text', async () => {
    respond(422, {
      detail: [
        { loc: ['body', 'price'], msg: 'Input should be greater than 0' },
        { loc: ['body', 'image_url'], msg: 'Value error, image_url must be an http(s) URL' },
      ],
    })

    await expect(request('/x')).rejects.toThrow(
      'price: Input should be greater than 0; image_url: image_url must be an http(s) URL',
    )
  })

  it('falls back to a generic message when the body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => Promise.reject(new Error('bad')) }),
    )

    await expect(request('/x')).rejects.toThrow('Request failed (500)')
  })

  it('reports an unreachable backend in plain language', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await request('/x').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(0)
    expect((error as ApiError).message).toMatch(/backend/i)
  })
})
