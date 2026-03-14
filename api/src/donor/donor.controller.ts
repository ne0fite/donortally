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
import { DonorService } from './donor.service';
import { BulkDeleteDonorsDto, CreateDonorDto, ImportDonorsDto, UpdateDonorDto } from './donor.dto';

@UseGuards(JwtAuthGuard)
@Controller('donor')
export class DonorController {
  constructor(private readonly donorService: DonorService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.donorService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.donorService.findOne(id, user.organizationId);
  }

  @Post()
  create(@Body() dto: CreateDonorDto, @CurrentUser() user: any) {
    return this.donorService.create(dto, user.organizationId, user.id);
  }

  @Post('import')
  bulkImport(@Body() dto: ImportDonorsDto, @CurrentUser() user: any) {
    return this.donorService.bulkImport(dto, user.organizationId, user.id);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDonorDto, @CurrentUser() user: any) {
    return this.donorService.update(id, user.organizationId, dto, user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  bulkRemove(@Body() dto: BulkDeleteDonorsDto, @CurrentUser() user: any) {
    return this.donorService.bulkRemove(dto.ids, user.organizationId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.donorService.remove(id, user.organizationId);
  }
}
