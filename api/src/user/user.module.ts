import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [SequelizeModule.forFeature([User]), EmailModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
