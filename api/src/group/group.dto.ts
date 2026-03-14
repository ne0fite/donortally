import { GroupEntityType } from '../models/group.model';

export class CreateGroupDto {
  name: string;
  entityType: GroupEntityType;
  description?: string;
}

export class UpdateGroupDto {
  name?: string;
  description?: string;
}
