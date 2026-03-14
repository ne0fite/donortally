import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationDto } from './organization.dto';

@UseGuards(JwtAuthGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('me')
  findMe(@CurrentUser() user: any) {
    return this.organizationService.findOne(user.organizationId);
  }

  @Post('me')
  update(@Body() dto: UpdateOrganizationDto, @CurrentUser() user: any) {
    return this.organizationService.update(user.organizationId, dto, user.id);
  }
}
