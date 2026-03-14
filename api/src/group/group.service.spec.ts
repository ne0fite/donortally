import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Group, GroupEntityType } from '../models/group.model';
import { makeGroup, GROUP_ID } from '../test/fixtures/group.fixture';
import { ORG_ID, USER_ID } from '../test/fixtures/user.fixture';
import { GroupService } from './group.service';

describe('GroupService', () => {
  let service: GroupService;
  let groupModel: { findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    groupModel = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        { provide: getModelToken(Group), useValue: groupModel },
      ],
    }).compile();

    service = module.get(GroupService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns all groups for the organization', async () => {
      const groups = [makeGroup(), makeGroup({ id: 'other-id' })];
      groupModel.findAll.mockResolvedValue(groups);

      const result = await service.findAll(ORG_ID);

      expect(groupModel.findAll).toHaveBeenCalledWith({ where: { organizationId: ORG_ID } });
      expect(result).toEqual(groups);
    });
  });

  describe('findOne', () => {
    it('returns the group when found', async () => {
      const group = makeGroup();
      groupModel.findOne.mockResolvedValue(group);

      const result = await service.findOne(GROUP_ID, ORG_ID);

      expect(groupModel.findOne).toHaveBeenCalledWith({ where: { id: GROUP_ID, organizationId: ORG_ID } });
      expect(result).toEqual(group);
    });

    it('throws NotFoundException when group does not exist', async () => {
      groupModel.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns a new group', async () => {
      const dto = { name: 'VIP Donors', entityType: GroupEntityType.DONOR };
      const created = makeGroup({ ...dto });
      groupModel.create.mockResolvedValue(created);

      const result = await service.create(dto, ORG_ID, USER_ID);

      expect(groupModel.create).toHaveBeenCalledWith({ ...dto, organizationId: ORG_ID, createdById: USER_ID, updatedById: USER_ID });
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('updates and returns the group', async () => {
      const dto = { name: 'Updated Name' };
      const group: any = makeGroup();
      const updated = makeGroup({ ...dto });
      group.update = jest.fn().mockResolvedValue(updated);
      groupModel.findOne.mockResolvedValue(group);

      const result = await service.update(GROUP_ID, ORG_ID, dto, USER_ID);

      expect(group.update).toHaveBeenCalledWith({ ...dto, updatedById: USER_ID });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when group does not exist', async () => {
      groupModel.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', ORG_ID, {}, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('destroys the group', async () => {
      const group: any = makeGroup();
      group.destroy = jest.fn().mockResolvedValue(undefined);
      groupModel.findOne.mockResolvedValue(group);

      await service.remove(GROUP_ID, ORG_ID);

      expect(group.destroy).toHaveBeenCalled();
    });

    it('throws NotFoundException when group does not exist', async () => {
      groupModel.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
