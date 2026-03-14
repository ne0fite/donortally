import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { JwtPayload } from './jwt.strategy';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.userModel.unscoped().findOne({ where: { email, isActive: true } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await user.update({ lastLogin: new Date() });

    return { accessToken: this.signToken(user) };
  }

  async validateInviteToken(token: string): Promise<{ email: string; firstName: string; lastName: string }> {
    const user = await this.userModel.unscoped().findOne({ where: { inviteToken: token } });
    if (!user || !user.inviteTokenExpiresAt || new Date() > user.inviteTokenExpiresAt) {
      throw new BadRequestException('Invalid or expired invite token');
    }
    return { email: user.email, firstName: user.firstName, lastName: user.lastName };
  }

  async activateInvite(token: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.userModel.unscoped().findOne({ where: { inviteToken: token } });
    if (!user || !user.inviteTokenExpiresAt || new Date() > user.inviteTokenExpiresAt || user.isActive) {
      throw new BadRequestException('Invalid or expired invite token');
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    await user.update({ password: hashed, isActive: true, inviteToken: null, inviteTokenExpiresAt: null, lastLogin: new Date() });

    return { accessToken: this.signToken(user) };
  }

  private signToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      isSuperAdmin: user.isSuperAdmin,
    };
    return this.jwtService.sign(payload);
  }
}
