import { GroupEntityType } from '../../models/group.model';
import { ORG_ID, USER_ID } from './user.fixture';

export const GROUP_ID = 'f6a7b8c9-0000-0000-0000-000000000001';

export function makeGroup(overrides: Record<string, any> = {}) {
  return {
    id: GROUP_ID,
    name: 'Major Donors',
    description: 'Donors who gave over $1000',
    entityType: GroupEntityType.DONOR,
    organizationId: ORG_ID,
    createdById: USER_ID,
    updatedById: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}
