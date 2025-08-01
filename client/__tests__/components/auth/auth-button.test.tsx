import { render, screen, renderUnauthenticated, renderWithRole } from '../../../tests/setup/testUtils'
import { AuthButton } from '../../../components/auth/auth-button'
import userEvent from '@testing-library/user-event'

// Mock the auth hook
const mockLogin = jest.fn()
const mockLogout = jest.fn()

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    login: mockLogin,
    logout: mockLogout,
    clearError: jest.fn(),
  }),
}))

describe('AuthButton Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    mockLogin.mockClear()
    mockLogout.mockClear()
  })

  it('shows login button when user is not authenticated', () => {
    renderUnauthenticated(<AuthButton />)
    
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('shows logout button when user is authenticated', () => {
    renderWithRole(<AuthButton />, 'customer')
    
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument()
  })

  it('displays user information when authenticated', () => {
    renderWithRole(<AuthButton />, 'customer')
    
    expect(screen.getByText(/john doe/i)).toBeInTheDocument()
    expect(screen.getByText(/customer/i)).toBeInTheDocument()
  })

  it('handles logout when logout button is clicked', async () => {
    renderWithRole(<AuthButton />, 'customer')
    
    const logoutButton = screen.getByRole('button', { name: /sign out/i })
    await user.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })

  it('shows loading state correctly', () => {
    render(<AuthButton />, { authLoading: true })
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('displays different UI for admin users', () => {
    renderWithRole(<AuthButton />, 'admin_l1')
    
    expect(screen.getByText(/admin/i)).toBeInTheDocument()
    expect(screen.getByText(/admin user/i)).toBeInTheDocument()
  })

  describe('Multi-tenant Context', () => {
    it('displays company information when available', () => {
      renderWithRole(<AuthButton />, 'customer')
      
      expect(screen.getByText(/acme logistics/i)).toBeInTheDocument()
    })

    it('handles missing company gracefully', () => {
      render(<AuthButton />, { company: null })
      
      expect(screen.queryByText(/acme logistics/i)).not.toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('displays auth error when present', () => {
      renderWithError(<AuthButton />, 'Authentication failed', 'auth')
      
      expect(screen.getByText(/authentication failed/i)).toBeInTheDocument()
    })

    it('allows clearing auth errors', async () => {
      renderWithError(<AuthButton />, 'Authentication failed', 'auth')
      
      const clearButton = screen.getByRole('button', { name: /clear error/i })
      await user.click(clearButton)
      
      // The error should be cleared through the auth context
      expect(screen.queryByText(/authentication failed/i)).not.toBeInTheDocument()
    })
  })
})