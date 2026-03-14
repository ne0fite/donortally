export const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
export const ORG_ID = 'a1b2c3d4-0000-0000-0000-000000000002';

export function makeUser(overrides: Record<string, any> = {}) {
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
