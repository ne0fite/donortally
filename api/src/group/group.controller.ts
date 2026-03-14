import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GroupService } from './group.service';
import { CreateGroupDto, UpdateGroupDto } from './group.dto';

@UseGuards(JwtAuthGuard)
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.groupService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupService.findOne(id, user.organizationId);
  }

  @Post()
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: any) {
    return this.groupService.create(dto, user.organizationId, user.id);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto, @CurrentUser() user: any) {
    return this.groupService.update(id, user.organizationId, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupService.remove(id, user.organizationId);
  }
}
