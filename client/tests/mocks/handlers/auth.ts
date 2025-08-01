import { http, HttpResponse } from 'msw'
import { testUsers, testCompanies } from '../../fixtures/users'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const authHandlers = [
  // Login endpoint
  http.post(`${API_BASE_URL}/api/v1/auth/login`, async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string }
    
    // Find user by email
    const user = Object.values(testUsers).find(u => u.email === email)
    
    if (!user || password !== 'password123') {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    return HttpResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId
      },
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    })
  }),
  
  // Signup endpoint
  http.post(`${API_BASE_URL}/api/v1/auth/signup`, async ({ request }) => {
    const userData = await request.json() as any
    
    return HttpResponse.json({
      user: {
        id: 'new-user-id',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'customer',
        companyId: userData.companyId
      },
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    }, { status: 201 })
  }),
  
  // Get profile endpoint
  http.get(`${API_BASE_URL}/api/v1/auth/profile`, () => {
    const user = testUsers.acmeCustomer
    
    return HttpResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
      phone: user.phone,
      address: user.address,
      isActive: true
    })
  }),
  
  // Refresh token endpoint
  http.post(`${API_BASE_URL}/api/v1/auth/refresh`, () => {
    return HttpResponse.json({
      accessToken: 'new-mock-jwt-token',
      refreshToken: 'new-mock-refresh-token'
    })
  }),
]