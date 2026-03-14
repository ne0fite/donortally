import { DonorContactLabel, DonorContactType } from '../../models/donor-contact.model';
import { DONOR_ID } from './donor.fixture';
import { USER_ID } from './user.fixture';

export const DONOR_CONTACT_ID = 'c3d4e5f6-0000-0000-0000-000000000001';

export function makeDonorContact(overrides: Record<string, any> = {}) {
  return {
    id: DONOR_CONTACT_ID,
    donorId: DONOR_ID,
    type: DonorContactType.EMAIL,
    label: DonorContactLabel.HOME,
    value: 'john.smith@example.com',
    createdById: USER_ID,
    updatedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}
