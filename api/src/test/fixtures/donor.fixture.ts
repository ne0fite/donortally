import { ORG_ID, USER_ID } from './user.fixture';
import { makeDonorContact } from './donor-contact.fixture';

export const DONOR_ID = 'b2c3d4e5-0000-0000-0000-000000000001';

export function makeDonor(overrides: Record<string, any> = {}) {
  return {
    id: DONOR_ID,
    donorId: null,
    title: null,
    firstName: 'John',
    lastName: 'Smith',
    organizationName: 'Acme Corp',
    address1: '123 Main St',
    address2: null,
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701',
    organizationId: ORG_ID,
    createdById: USER_ID,
    updatedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    contacts: [makeDonorContact()],
    ...overrides,
  };
}
