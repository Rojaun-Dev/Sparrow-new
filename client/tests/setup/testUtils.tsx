import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { testUsers, testCompanies } from '../fixtures/users'

// Mock the auth context
const mockAuthContext = {
  user: testUsers.acmeCustomer,
  isLoading: false,
  error: null,
  isAuthenticated: true,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  clearError: jest.fn(),
}

// Mock the company context
const mockCompanyContext = {
  company: testCompanies.acmeLogistics,
  isLoading: false,
  error: null,
  switchCompany: jest.fn(),
  refreshCompany: jest.fn(),
}

// Mock AuthContext
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock CompanyContext
jest.mock('../../hooks/useCompanyContext', () => ({
  useCompanyContext: () => mockCompanyContext,
  CompanyProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Auth context overrides
  user?: typeof testUsers.acmeCustomer | null
  isAuthenticated?: boolean
  authLoading?: boolean
  authError?: string | null
  
  // Company context overrides
  company?: typeof testCompanies.acmeLogistics | null
  companyLoading?: boolean
  companyError?: string | null
  
  // Query client options
  queryClient?: QueryClient
}

// All the providers wrapper
function AllTheProviders({ 
  children,
  user = testUsers.acmeCustomer,
  isAuthenticated = true,
  authLoading = false,
  authError = null,
  company = testCompanies.acmeLogistics,
  companyLoading = false,
  companyError = null,
  queryClient,
}: { 
  children: React.ReactNode 
} & CustomRenderOptions) {
  // Create a new query client for each test to ensure isolation
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry failed requests in tests
        staleTime: Infinity, // Don't automatically refetch data
      },
      mutations: {
        retry: false,
      },
    },
  })

  // Override mock contexts with test-specific values
  Object.assign(mockAuthContext, {
    user,
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
  })

  Object.assign(mockCompanyContext, {
    company,
    isLoading: companyLoading,
    error: companyError,
  })

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Custom render function
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const {
    user,
    isAuthenticated,
    authLoading,
    authError,
    company,
    companyLoading,
    companyError,
    queryClient,
    ...renderOptions
  } = options

  return render(ui, {
    wrapper: (props) => AllTheProviders({
      ...props,
      user,
      isAuthenticated,
      authLoading,
      authError,
      company,
      companyLoading,
      companyError,
      queryClient,
    }),
    ...renderOptions,
  })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test utilities
export const createMockQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
})

// Helper to render with specific user role
export const renderWithRole = (ui: ReactElement, role: 'customer' | 'admin_l1' | 'admin_l2' | 'super_admin') => {
  const user = role === 'customer' ? testUsers.acmeCustomer : testUsers.acmeAdmin
  return customRender(ui, { user: { ...user, role } })
}

// Helper to render with different company
export const renderWithCompany = (ui: ReactElement, companyKey: keyof typeof testCompanies) => {
  const company = testCompanies[companyKey]
  const user = companyKey === 'acmeLogistics' ? testUsers.acmeCustomer : testUsers.swiftCustomer
  return customRender(ui, { company, user })
}

// Helper to render unauthenticated
export const renderUnauthenticated = (ui: ReactElement) => {
  return customRender(ui, { 
    user: null, 
    isAuthenticated: false,
    company: null 
  })
}

// Helper to render with loading states
export const renderWithLoading = (ui: ReactElement, type: 'auth' | 'company' | 'both' = 'both') => {
  return customRender(ui, {
    authLoading: type === 'auth' || type === 'both',
    companyLoading: type === 'company' || type === 'both',
  })
}

// Helper to render with error states
export const renderWithError = (ui: ReactElement, error: string, type: 'auth' | 'company' = 'auth') => {
  return customRender(ui, {
    authError: type === 'auth' ? error : null,
    companyError: type === 'company' ? error : null,
  })
}