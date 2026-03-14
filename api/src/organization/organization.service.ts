import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Organization } from '../models/organization.model';
import { UpdateOrganizationDto } from './organization.dto';

@Injectable()
export class OrganizationService {
  constructor(@InjectModel(Organization) private readonly orgModel: typeof Organization) {}

  async findOne(id: string): Promise<Organization> {
    const org = await this.orgModel.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto, userId: string): Promise<Organization> {
    const org = await this.findOne(id);
    return org.update({ ...dto, updatedById: userId });
  }
}
