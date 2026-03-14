import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { CreateUserDto, UpdateUserDto } from './user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async findMe(id: string): Promise<User> {
    const user = await this.userModel.findOne({ where: { id }, include: [Organization] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findAll(organizationId: string): Promise<User[]> {
    return this.userModel.findAll({ where: { organizationId } });
  }

  async findOne(id: string, organizationId: string): Promise<User> {
    const user = await this.userModel.findOne({ where: { id, organizationId } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto, organizationId: string, userId: string): Promise<User> {
    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    return this.userModel.create({ ...dto, password, organizationId, createdById: userId, updatedById: userId });
  }

  async update(id: string, organizationId: string, dto: UpdateUserDto, userId: string): Promise<User> {
    const user = await this.findOne(id, organizationId);
    const { password, ...rest } = dto;
    const updates: Partial<User> = { ...rest, updatedById: userId };
    if (password) updates.password = await bcrypt.hash(password, SALT_ROUNDS);
    return user.update(updates);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const user = await this.findOne(id, organizationId);
    await user.destroy();
  }
}
