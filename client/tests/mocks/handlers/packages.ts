import { http, HttpResponse } from 'msw'
import { testPackages } from '../../fixtures/packages'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const packagesHandlers = [
  // Get all packages
  http.get(`${API_BASE_URL}/api/v1/packages`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')
    
    let packages = Object.values(testPackages)
    
    // Apply filters
    if (status) {
      packages = packages.filter(pkg => pkg.status === status)
    }
    
    if (search) {
      packages = packages.filter(pkg => 
        pkg.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
        pkg.recipientName.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPackages = packages.slice(startIndex, endIndex)
    
    return HttpResponse.json({
      data: paginatedPackages,
      pagination: {
        page,
        limit,
        total: packages.length,
        totalPages: Math.ceil(packages.length / limit)
      }
    })
  }),
  
  // Get package by ID
  http.get(`${API_BASE_URL}/api/v1/packages/:id`, ({ params }) => {
    const { id } = params
    const packageData = Object.values(testPackages).find(pkg => pkg.id === id)
    
    if (!packageData) {
      return HttpResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json(packageData)
  }),
  
  // Create package
  http.post(`${API_BASE_URL}/api/v1/packages`, async ({ request }) => {
    const packageData = await request.json() as any
    
    const newPackage = {
      id: `pkg-${Date.now()}`,
      ...packageData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    return HttpResponse.json(newPackage, { status: 201 })
  }),
  
  // Update package
  http.put(`${API_BASE_URL}/api/v1/packages/:id`, async ({ params, request }) => {
    const { id } = params
    const updates = await request.json() as any
    
    const packageData = Object.values(testPackages).find(pkg => pkg.id === id)
    
    if (!packageData) {
      return HttpResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }
    
    const updatedPackage = {
      ...packageData,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    
    return HttpResponse.json(updatedPackage)
  }),
  
  // Delete package
  http.delete(`${API_BASE_URL}/api/v1/packages/:id`, ({ params }) => {
    const { id } = params
    const packageData = Object.values(testPackages).find(pkg => pkg.id === id)
    
    if (!packageData) {
      return HttpResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }
    
    return HttpResponse.json({ message: 'Package deleted successfully' })
  }),
]