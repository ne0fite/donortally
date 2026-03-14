import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Donation } from '../models/donation.model';
import { Donor } from '../models/donor.model';
import { DonationService } from './donation.service';
import { DonationController } from './donation.controller';

@Module({
  imports: [SequelizeModule.forFeature([Donation, Donor])],
  controllers: [DonationController],
  providers: [DonationService],
  exports: [DonationService],
})
export class DonationModule {}
