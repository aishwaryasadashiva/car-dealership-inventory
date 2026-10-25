const BASE: string = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type FastApiIssue = { loc?: (string | number)[]; msg?: string }

/** FastAPI returns a string for domain errors and a list for validation errors. */
function messageFrom(detail: unknown, status: number): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const text = (detail as FastApiIssue[])
      .map((issue) => {
        const field = issue.loc?.filter((part) => part !== 'body').at(-1)
        const msg = (issue.msg ?? '').replace(/^Value error, /, '')
        return field ? `${field}: ${msg}` : msg
      })
      .filter(Boolean)
      .join('; ')
    if (text) return text
  }
  return `Request failed (${status})`
}

type Options = {
  token?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  json?: unknown
  form?: Record<string, string>
  query?: Record<string, string | number | boolean | undefined>
}

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { token, method = 'GET', json, form, query } = options

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  const url = `${BASE}${path}${params.size ? `?${params}` : ''}`

  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let body: string | undefined
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  } else if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    body = new URLSearchParams(form).toString()
  }

  let response: Response
  try {
    response = await fetch(url, { method, headers, body })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running on port 8000?')
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(response.status, messageFrom(payload?.detail, response.status))
  }
  return response.json() as Promise<T>
}
