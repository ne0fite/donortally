// Named user-record to avoid collision with the auth user.fixture.ts
import { ORG_ID, USER_ID } from './user.fixture';

export function makeUserRecord(overrides: Record<string, any> = {}) {
  return {
    id: USER_ID,
    email: 'user@example.com',
    password: '$2b$10$hashedpasswordvalue00000000000000000000000000000',
    firstName: 'Jane',
    lastName: 'Doe',
    isSuperAdmin: false,
    isActive: true,
    organizationId: ORG_ID,
    createdById: null,
    updatedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}
