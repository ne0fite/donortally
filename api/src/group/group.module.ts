import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Group } from '../models/group.model';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';

@Module({
  imports: [SequelizeModule.forFeature([Group])],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
