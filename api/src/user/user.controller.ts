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
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.userService.findAll(user.organizationId);
  }

  @Get('me')
  async findMe(@CurrentUser() user: any) {
    const me = await this.userService.findMe(user.id);
    return { ...me.toJSON(), googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? '' };
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.userService.findOne(id, user.organizationId);
  }

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.userService.create(dto, user.organizationId, user.id);
  }

  @Post(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: any) {
    return this.userService.update(id, user.organizationId, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.userService.remove(id, user.organizationId);
  }
}
