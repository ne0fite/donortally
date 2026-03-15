import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';
import { makeUserRecord } from '../test/fixtures/user-record.fixture';
import { ORG_ID, USER_ID } from '../test/fixtures/user.fixture';
import { UserService } from './user.service';
import { EmailService } from '../email/email.service';

jest.mock('bcrypt');
const bcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

describe('UserService', () => {
  let service: UserService;
  let userModel: { findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock; unscoped: jest.Mock };
  let emailService: { sendInvite: jest.Mock };
  let unscopedModel: { findAll: jest.Mock; findOne: jest.Mock };

  beforeEach(async () => {
    unscopedModel = { findAll: jest.fn(), findOne: jest.fn() };
    userModel = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), unscoped: jest.fn().mockReturnValue(unscopedModel) };
    emailService = { sendInvite: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User), useValue: userModel },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns all users with hasPendingInvite flag', async () => {
      const base = makeUserRecord({ inviteToken: null });
      const pending = makeUserRecord({ id: 'other-id', inviteToken: 'some-token', isActive: false });
      const toJSON = (r: any) => jest.fn().mockReturnValue(r);
      const mockUsers = [
        { ...base, toJSON: toJSON(base) },
        { ...pending, toJSON: toJSON(pending) },
      ];
      unscopedModel.findAll.mockResolvedValue(mockUsers);

      const result = await service.findAll(ORG_ID);

      expect(userModel.unscoped).toHaveBeenCalled();
      expect(unscopedModel.findAll).toHaveBeenCalledWith({ where: { organizationId: ORG_ID } });
      expect(result[0].hasPendingInvite).toBe(false);
      expect(result[1].hasPendingInvite).toBe(true);
    });
  });

  describe('findOne', () => {
    it('returns the user when found', async () => {
      const user = makeUserRecord();
      userModel.findOne.mockResolvedValue(user);

      const result = await service.findOne(user.id, ORG_ID);

      expect(userModel.findOne).toHaveBeenCalledWith({ where: { id: user.id, organizationId: ORG_ID } });
      expect(result).toEqual(user);
    });

    it('throws NotFoundException when user does not exist', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('hashes the password and creates the user', async () => {
      const dto = { email: 'new@example.com', password: 'plaintext', firstName: 'New', lastName: 'User' };
      const hashed = '$2b$10$hashed';
      const created = makeUserRecord({ email: dto.email, password: hashed });
      bcryptHash.mockResolvedValue(hashed as never);
      userModel.create.mockResolvedValue(created);

      const result = await service.create(dto, ORG_ID, USER_ID);

      expect(bcryptHash).toHaveBeenCalledWith('plaintext', 10);
      expect(userModel.create).toHaveBeenCalledWith({ ...dto, password: hashed, organizationId: ORG_ID, createdById: USER_ID, updatedById: USER_ID });
      expect(result).toEqual(created);
    });

    it('sends invite email with acting user when sendInvite is true', async () => {
      const dto = { email: 'invited@example.com', firstName: 'Invited', lastName: 'Person', sendInvite: true };
      const created = makeUserRecord({ email: dto.email, isActive: false });
      const actingUser = makeUserRecord({ organization: { name: 'Test Org' } });
      userModel.create.mockResolvedValue(created);
      userModel.findOne.mockResolvedValue(actingUser);

      await service.create(dto, ORG_ID, USER_ID);

      expect(emailService.sendInvite).toHaveBeenCalledWith(dto.email, actingUser, expect.stringContaining('/activate?token='));
    });
  });

  describe('update', () => {
    it('updates and returns the user', async () => {
      const dto = { firstName: 'Updated' };
      const user: any = makeUserRecord();
      const updated = makeUserRecord({ ...dto });
      user.update = jest.fn().mockResolvedValue(updated);
      userModel.findOne.mockResolvedValue(user);

      const result = await service.update(user.id, ORG_ID, dto, USER_ID);

      expect(user.update).toHaveBeenCalledWith({ ...dto, updatedById: USER_ID });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when user does not exist', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', ORG_ID, {}, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('destroys the user', async () => {
      const user: any = makeUserRecord();
      user.destroy = jest.fn().mockResolvedValue(undefined);
      userModel.findOne.mockResolvedValue(user);

      await service.remove(user.id, ORG_ID);

      expect(user.destroy).toHaveBeenCalled();
    });

    it('throws NotFoundException when user does not exist', async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('resendInvite', () => {
    it('generates a new token and sends invite email', async () => {
      const user: any = makeUserRecord({ isActive: false, inviteToken: 'old-token' });
      user.update = jest.fn().mockResolvedValue(user);
      unscopedModel.findOne.mockResolvedValue(user);

      const actingUser = makeUserRecord({ organization: { name: 'Test Org' } });
      userModel.findOne.mockResolvedValue(actingUser);

      await service.resendInvite(user.id, ORG_ID, USER_ID);

      expect(userModel.unscoped).toHaveBeenCalled();
      expect(unscopedModel.findOne).toHaveBeenCalledWith({ where: { id: user.id, organizationId: ORG_ID } });
      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({ updatedById: USER_ID, inviteToken: expect.any(String), inviteTokenExpiresAt: expect.any(Date) }),
      );
      expect(emailService.sendInvite).toHaveBeenCalledWith(user.email, actingUser, expect.stringContaining('/activate?token='));
    });

    it('throws NotFoundException when user does not exist', async () => {
      unscopedModel.findOne.mockResolvedValue(null);

      await expect(service.resendInvite('nonexistent-id', ORG_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when user is already active', async () => {
      const user: any = makeUserRecord({ isActive: true });
      unscopedModel.findOne.mockResolvedValue(user);

      await expect(service.resendInvite(user.id, ORG_ID, USER_ID)).rejects.toThrow(BadRequestException);
    });
  });
});
