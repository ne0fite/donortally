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
import { DonationService } from './donation.service';
import { BulkDeleteDonationsDto, CreateDonationDto, ImportDonationsDto, UpdateDonationDto } from './donation.dto';

@UseGuards(JwtAuthGuard)
@Controller('donation')
export class DonationController {
  constructor(private readonly donationService: DonationService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.donationService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.donationService.findOne(id, user.organizationId);
  }

  @Post('import')
  bulkImport(@Body() dto: ImportDonationsDto, @CurrentUser() user: any) {
    return this.donationService.bulkImport(dto, user.organizationId, user.id);
  }

  @Post()
  create(@Body() dto: CreateDonationDto, @CurrentUser() user: any) {
    return this.donationService.create(dto, user.organizationId, user.id);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDonationDto, @CurrentUser() user: any) {
    return this.donationService.update(id, user.organizationId, dto, user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  bulkRemove(@Body() dto: BulkDeleteDonationsDto, @CurrentUser() user: any) {
    return this.donationService.bulkRemove(dto.ids, user.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.donationService.remove(id, user.organizationId);
  }
}
