import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthScreen } from './AuthScreen'

// The login hero has no image_url, so stub the Wikipedia lookup to stay offline.
vi.mock('../lib/photo', () => ({ resolveCarPhoto: () => Promise.resolve(null) }))

function setup(overrides: Partial<React.ComponentProps<typeof AuthScreen>> = {}) {
  const onSignIn = vi.fn().mockResolvedValue(undefined)
  const onSignUp = vi.fn().mockResolvedValue(undefined)
  render(<AuthScreen onSignIn={onSignIn} onSignUp={onSignUp} {...overrides} />)
  return { onSignIn, onSignUp }
}

describe('AuthScreen', () => {
  it('signs in with the typed credentials', async () => {
    const { onSignIn } = setup()

    await userEvent.type(screen.getByLabelText('Email'), 'a@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'StrongPassword123!')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(onSignIn).toHaveBeenCalledWith('a@example.com', 'StrongPassword123!')
  })

  it('switches to registration', async () => {
    const { onSignUp } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Create an account' }))
    await userEvent.type(screen.getByLabelText('Email'), 'new@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'StrongPassword123!')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(onSignUp).toHaveBeenCalledWith('new@example.com', 'StrongPassword123!')
  })

  it('shows the error returned by the server', async () => {
    setup({ onSignIn: vi.fn().mockRejectedValue(new Error('Invalid email or password')) })

    await userEvent.type(screen.getByLabelText('Email'), 'a@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
  })

  it('shows a notice such as an expired session', () => {
    setup({ notice: 'Your session expired. Please sign in again.' })

    expect(screen.getByRole('status')).toHaveTextContent('session expired')
  })

  it('can reveal the password', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }))

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
  })
})
