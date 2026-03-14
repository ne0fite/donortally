import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { DonorModule } from './donor/donor.module';
import { DonationModule } from './donation/donation.module';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
import { CampaignModule } from './campaign/campaign.module';
import { OrganizationModule } from './organization/organization.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    DonorModule,
    DonationModule,
    UserModule,
    GroupModule,
    CampaignModule,
    OrganizationModule,
  ],
})
export class AppModule {}
