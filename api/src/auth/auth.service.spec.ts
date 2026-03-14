import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { makeUser } from '../test/fixtures/user.fixture';
import { AuthService } from './auth.service';

jest.mock('bcrypt');
const bcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

describe('AuthService', () => {
  let service: AuthService;
  let userModel: { unscoped: jest.Mock; findOne: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    userModel = { unscoped: jest.fn().mockReturnThis(), findOne: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User), useValue: userModel },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('returns an accessToken on valid credentials', async () => {
      const user = makeUser();
      userModel.findOne.mockResolvedValue(user);
      bcryptCompare.mockResolvedValue(true as never);

      const result = await service.login(user.email, 'plaintext');

      expect(userModel.unscoped).toHaveBeenCalled();
      expect(userModel.findOne).toHaveBeenCalledWith({
        where: { email: user.email, isActive: true },
      });
      expect(bcryptCompare).toHaveBeenCalledWith('plaintext', user.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
        organizationId: user.organizationId,
        isSuperAdmin: user.isSuperAdmin,
      });
      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
    });

    it('throws UnauthorizedException when user is not found', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.login('unknown@example.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcryptCompare).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException on wrong password', async () => {
      userModel.findOne.mockResolvedValue(makeUser());
      bcryptCompare.mockResolvedValue(false as never);

      await expect(service.login('user@example.com', 'wrongpass')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException for inactive users', async () => {
      userModel.findOne.mockResolvedValue(null); // isActive: true filter excludes them

      await expect(service.login('user@example.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
