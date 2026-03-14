import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Campaign } from '../models/campaign.model';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';

@Module({
  imports: [SequelizeModule.forFeature([Campaign])],
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
