import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { Organization } from '../models/organization.model';
import { User } from '../models/user.model';
import { Donor } from '../models/donor.model';
import { Campaign } from '../models/campaign.model';
import { Group } from '../models/group.model';
import { Donation } from '../models/donation.model';
import { DonorContact } from '../models/donor-contact.model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        return {
          dialect: 'postgres',
          host: config.get('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get('DB_USER'),
          password: config.get('DB_PASS'),
          database: config.get('DB_NAME'),
          models: [Organization, User, Donor, Campaign, Group, Donation, DonorContact],
          autoLoadModels: true,
          synchronize: false,
          dialectOptions: isProd
            ? { ssl: { require: true, rejectUnauthorized: false } }
            : {},
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
