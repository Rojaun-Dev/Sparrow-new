import { render, screen, waitFor } from '../../../tests/setup/testUtils'
import userEvent from '@testing-library/user-event'
import { server } from '../../../tests/mocks/server'
import { http, HttpResponse } from 'msw'

// Mock Login Form Component (since we need to create one for testing)
const LoginForm = () => {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Invalid credentials')
      }

      const data = await response.json()
      // Handle successful login
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <div role="alert" data-testid="login-error">
          {error}
        </div>
      )}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}

describe('LoginForm Component', () => {
  const user = userEvent.setup()

  it('renders form fields correctly', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('handles successful login', async () => {
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'john.doe@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Check loading state
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    // Should not show any error
    expect(screen.queryByTestId('login-error')).not.toBeInTheDocument()
  })

  it('handles login failure', async () => {
    // Override the handler to return an error
    server.use(
      http.post('*/api/v1/auth/login', () => {
        return HttpResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      })
    )

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument()
    })

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    // HTML5 validation should prevent submission
    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toBeInvalid()
  })

  it('disables submit button during loading', async () => {
    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'john.doe@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Button should be disabled during loading
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  describe('Form Validation', () => {
    it('validates email format', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')

      expect(emailInput).toBeInvalid()
    })

    it('accepts valid email format', async () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'valid@example.com')

      expect(emailInput).toBeValid()
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('announces errors to screen readers', async () => {
      server.use(
        http.post('*/api/v1/auth/login', () => {
          return HttpResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          )
        })
      )

      render(<LoginForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'wrong@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        const errorElement = screen.getByRole('alert')
        expect(errorElement).toBeInTheDocument()
        expect(errorElement).toHaveTextContent(/invalid credentials/i)
      })
    })
  })
})