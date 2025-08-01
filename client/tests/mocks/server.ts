import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup MSW server for Node.js environment (Jest tests)
export const server = setupServer(...handlers)

// Enable request interception before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers between tests to ensure test isolation
afterEach(() => server.resetHandlers())

// Clean up after all tests are done
afterAll(() => server.close())