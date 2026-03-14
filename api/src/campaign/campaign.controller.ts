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
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, UpdateCampaignDto } from './campaign.dto';

@UseGuards(JwtAuthGuard)
@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.campaignService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.campaignService.findOne(id, user.organizationId);
  }

  @Post()
  create(@Body() dto: CreateCampaignDto, @CurrentUser() user: any) {
    return this.campaignService.create(dto, user.organizationId, user.id);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto, @CurrentUser() user: any) {
    return this.campaignService.update(id, user.organizationId, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.campaignService.remove(id, user.organizationId);
  }
}
