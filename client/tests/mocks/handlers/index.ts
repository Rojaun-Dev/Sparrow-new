import { authHandlers } from './auth'
import { packagesHandlers } from './packages'

export const handlers = [
  ...authHandlers,
  ...packagesHandlers,
]