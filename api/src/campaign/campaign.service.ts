import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Campaign } from '../models/campaign.model';
import { CreateCampaignDto, UpdateCampaignDto } from './campaign.dto';

@Injectable()
export class CampaignService {
  constructor(@InjectModel(Campaign) private readonly campaignModel: typeof Campaign) {}

  findAll(organizationId: string): Promise<Campaign[]> {
    return this.campaignModel.findAll({ where: { organizationId } });
  }

  async findOne(id: string, organizationId: string): Promise<Campaign> {
    const campaign = await this.campaignModel.findOne({ where: { id, organizationId } });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return campaign;
  }

  create(dto: CreateCampaignDto, organizationId: string, userId: string): Promise<Campaign> {
    return this.campaignModel.create({ ...dto, organizationId, createdById: userId, updatedById: userId });
  }

  async update(id: string, organizationId: string, dto: UpdateCampaignDto, userId: string): Promise<Campaign> {
    const campaign = await this.findOne(id, organizationId);
    return campaign.update({ ...dto, updatedById: userId });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const campaign = await this.findOne(id, organizationId);
    await campaign.destroy();
  }
}
