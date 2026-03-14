import { DonationStatus } from '../../models/donation.model';
import { DONOR_ID } from './donor.fixture';
import { ORG_ID, USER_ID } from './user.fixture';

export const DONATION_ID = 'd4e5f6a7-0000-0000-0000-000000000001';
export const CAMPAIGN_ID = 'e5f6a7b8-0000-0000-0000-000000000001';

export function makeDonation(overrides: Record<string, any> = {}) {
  return {
    id: DONATION_ID,
    amount: 100.00,
    currency: 'USD',
    donationDate: '2026-01-15',
    status: DonationStatus.COMPLETED,
    notes: null,
    donationId: 'DN-abc12345',
    paymentType: null,
    gift: null,
    organizationId: ORG_ID,
    donorId: DONOR_ID,
    campaignId: null,
    createdById: USER_ID,
    updatedById: null,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    donor: { id: DONOR_ID, firstName: 'John', lastName: 'Smith' },
    campaign: null,
    ...overrides,
  };
}
