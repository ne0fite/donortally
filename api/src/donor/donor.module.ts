import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Donor } from '../models/donor.model';
import { DonorContact } from '../models/donor-contact.model';
import { Donation } from '../models/donation.model';
import { DonorService } from './donor.service';
import { DonorController } from './donor.controller';

@Module({
  imports: [SequelizeModule.forFeature([Donor, DonorContact, Donation])],
  controllers: [DonorController],
  providers: [DonorService],
  exports: [DonorService],
})
export class DonorModule {}
