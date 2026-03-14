import { ORG_ID, USER_ID } from './user.fixture';

export const CAMPAIGN_ID = 'a7b8c9d0-0000-0000-0000-000000000001';

export function makeCampaign(overrides: Record<string, any> = {}) {
  return {
    id: CAMPAIGN_ID,
    name: 'Spring Fundraiser 2026',
    description: 'Annual spring campaign',
    startDate: '2026-03-01',
    endDate: '2026-05-31',
    goalAmount: 50000.00,
    isActive: true,
    organizationId: ORG_ID,
    createdById: USER_ID,
    updatedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}
