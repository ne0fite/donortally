import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Group } from '../models/group.model';
import { CreateGroupDto, UpdateGroupDto } from './group.dto';

@Injectable()
export class GroupService {
  constructor(@InjectModel(Group) private readonly groupModel: typeof Group) {}

  findAll(organizationId: string): Promise<Group[]> {
    return this.groupModel.findAll({ where: { organizationId } });
  }

  async findOne(id: string, organizationId: string): Promise<Group> {
    const group = await this.groupModel.findOne({ where: { id, organizationId } });
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    return group;
  }

  create(dto: CreateGroupDto, organizationId: string, userId: string): Promise<Group> {
    return this.groupModel.create({ ...dto, organizationId, createdById: userId, updatedById: userId });
  }

  async update(id: string, organizationId: string, dto: UpdateGroupDto, userId: string): Promise<Group> {
    const group = await this.findOne(id, organizationId);
    return group.update({ ...dto, updatedById: userId });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const group = await this.findOne(id, organizationId);
    await group.destroy();
  }
}
