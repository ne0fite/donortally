import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Organization } from '../models/organization.model';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';

@Module({
  imports: [SequelizeModule.forFeature([Organization])],
  controllers: [OrganizationController],
  providers: [OrganizationService],
})
export class OrganizationModule {}
