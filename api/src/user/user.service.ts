import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { Organization } from '../models/organization.model';
import { EmailService } from '../email/email.service';
import { CreateUserDto, UpdateUserDto } from './user.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly emailService: EmailService,
  ) {}

  async findMe(id: string): Promise<User> {
    const user = await this.userModel.findOne({ where: { id }, include: [Organization] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll(organizationId: string): Promise<(User & { hasPendingInvite: boolean })[]> {
    const users = await this.userModel.unscoped().findAll({ where: { organizationId } });
    return users.map((u) => Object.assign(u.toJSON(), { hasPendingInvite: u.inviteToken !== null })) as any;
  }

  async findOne(id: string, organizationId: string): Promise<User> {
    const user = await this.userModel.findOne({ where: { id, organizationId } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto, organizationId: string, userId: string): Promise<User> {
    if (dto.sendInvite) {
      const inviteToken = require('crypto').randomUUID();
      const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const { password: _, sendInvite: __, ...rest } = dto;
      const user = await this.userModel.create({
        ...rest,
        password: null,
        isActive: false,
        inviteToken,
        inviteTokenExpiresAt,
        organizationId,
        createdById: userId,
        updatedById: userId,
      });
      const activationUrl = `${process.env.CLIENT_URL}/activate?token=${inviteToken}`;
      const actingUser = await this.userModel.findOne({ where: { id: userId }, include: [Organization] });
      await this.emailService.sendInvite(dto.email, actingUser, activationUrl);
      return user;
    }

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

  async resendInvite(id: string, organizationId: string, actingUserId: string): Promise<void> {
    const user = await this.userModel.unscoped().findOne({ where: { id, organizationId } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    if (user.isActive) throw new BadRequestException('User is already active');

    const inviteToken = require('crypto').randomUUID();
    const inviteTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.update({ inviteToken, inviteTokenExpiresAt, updatedById: actingUserId });

    const activationUrl = `${process.env.CLIENT_URL}/activate?token=${inviteToken}`;
    const actingUser = await this.userModel.findOne({ where: { id: actingUserId }, include: [Organization] });
    await this.emailService.sendInvite(user.email, actingUser, activationUrl);
  }
}
