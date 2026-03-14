import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Donor } from '../models/donor.model';
import { DonorContact, DonorContactLabel, DonorContactType } from '../models/donor-contact.model';
import { makeDonor } from '../test/fixtures/donor.fixture';
import { makeDonorContact } from '../test/fixtures/donor-contact.fixture';
import { ORG_ID, USER_ID } from '../test/fixtures/user.fixture';
import { DonorService } from './donor.service';

const WITH_CONTACTS = { include: [DonorContact] };

// Fake transaction object passed into callbacks
const t = { id: 'mock-transaction' };

const contactDto = {
  type: DonorContactType.EMAIL,
  label: DonorContactLabel.HOME,
  value: 'john.smith@example.com',
};

describe('DonorService', () => {
  let service: DonorService;
  let donorModel: { findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock };
  let donorContactModel: { bulkCreate: jest.Mock; destroy: jest.Mock };
  let sequelize: { transaction: jest.Mock };

  beforeEach(async () => {
    donorModel = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() };
    donorContactModel = { bulkCreate: jest.fn(), destroy: jest.fn() };
    // Execute the transaction callback immediately with the mock transaction
    sequelize = { transaction: jest.fn((cb) => cb(t)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonorService,
        { provide: Sequelize, useValue: sequelize },
        { provide: getModelToken(Donor), useValue: donorModel },
        { provide: getModelToken(DonorContact), useValue: donorContactModel },
      ],
    }).compile();

    service = module.get(DonorService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns donors with contacts for the given organization', async () => {
      const donors = [makeDonor(), makeDonor({ id: 'other-id' })];
      donorModel.findAll.mockResolvedValue(donors);

      const result = await service.findAll(ORG_ID);

      expect(donorModel.findAll).toHaveBeenCalledWith({ where: { organizationId: ORG_ID }, ...WITH_CONTACTS });
      expect(result).toEqual(donors);
      expect(result[0].contacts).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns the donor with contacts when found', async () => {
      const donor = makeDonor();
      donorModel.findOne.mockResolvedValue(donor);

      const result = await service.findOne(donor.id, ORG_ID);

      expect(donorModel.findOne).toHaveBeenCalledWith({ where: { id: donor.id, organizationId: ORG_ID }, ...WITH_CONTACTS });
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0]).toMatchObject(makeDonorContact());
    });

    it('throws NotFoundException when donor does not exist', async () => {
      donorModel.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a donor without contacts', async () => {
      const dto = { firstName: 'John', lastName: 'Smith' };
      const created = makeDonor({ contacts: [] });
      donorModel.create.mockResolvedValue(created);
      donorModel.findOne.mockResolvedValue(created);

      const result = await service.create(dto, ORG_ID, USER_ID);

      expect(donorModel.create).toHaveBeenCalledWith(
        { ...dto, donorId: expect.stringMatching(/^DR-/), organizationId: ORG_ID, createdById: USER_ID, updatedById: USER_ID },
        { transaction: t },
      );
      expect(donorContactModel.bulkCreate).not.toHaveBeenCalled();
      expect(result).toEqual(created);
    });

    it('creates a donor with contacts', async () => {
      const dto = { firstName: 'John', lastName: 'Smith', contacts: [contactDto] };
      const created = makeDonor();
      donorModel.create.mockResolvedValue(created);
      donorModel.findOne.mockResolvedValue(created);

      await service.create(dto, ORG_ID, USER_ID);

      expect(donorContactModel.bulkCreate).toHaveBeenCalledWith(
        [{ ...contactDto, donorId: created.id, createdById: USER_ID, updatedById: USER_ID }],
        { transaction: t },
      );
    });
  });

  describe('update', () => {
    it('updates donor fields without touching contacts when contacts is omitted', async () => {
      const dto = { firstName: 'Updated' };
      const donor: any = makeDonor();
      const updated = makeDonor({ firstName: 'Updated' });
      donor.update = jest.fn().mockResolvedValue(donor);
      donorModel.findOne.mockResolvedValueOnce(donor).mockResolvedValueOnce(updated);

      const result = await service.update(donor.id, ORG_ID, dto, USER_ID);

      expect(donor.update).toHaveBeenCalledWith({ firstName: 'Updated', updatedById: USER_ID }, { transaction: t });
      expect(donorContactModel.destroy).not.toHaveBeenCalled();
      expect(donorContactModel.bulkCreate).not.toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('replaces contacts when contacts array is provided', async () => {
      const dto = { contacts: [contactDto] };
      const donor: any = makeDonor();
      donor.update = jest.fn().mockResolvedValue(donor);
      donorModel.findOne.mockResolvedValue(donor);

      await service.update(donor.id, ORG_ID, dto, USER_ID);

      expect(donorContactModel.destroy).toHaveBeenCalledWith({ where: { donorId: donor.id }, transaction: t });
      expect(donorContactModel.bulkCreate).toHaveBeenCalledWith(
        [{ ...contactDto, donorId: donor.id, createdById: USER_ID, updatedById: USER_ID }],
        { transaction: t },
      );
    });

    it('clears all contacts when an empty contacts array is provided', async () => {
      const dto = { contacts: [] };
      const donor: any = makeDonor();
      donor.update = jest.fn().mockResolvedValue(donor);
      donorModel.findOne.mockResolvedValue(donor);

      await service.update(donor.id, ORG_ID, dto, USER_ID);

      expect(donorContactModel.destroy).toHaveBeenCalledWith({ where: { donorId: donor.id }, transaction: t });
      expect(donorContactModel.bulkCreate).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when donor does not exist', async () => {
      donorModel.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', ORG_ID, {}, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkImport', () => {
    it('creates all donors when no donorId is present', async () => {
      const dto = {
        donors: [
          { firstName: 'Alice', lastName: 'A' },
          { firstName: 'Bob', lastName: 'B' },
        ],
      };
      donorModel.create.mockResolvedValue(makeDonor({ contacts: [] }));

      const result = await service.bulkImport(dto as any, ORG_ID, USER_ID);

      expect(donorModel.findOne).not.toHaveBeenCalled();
      expect(donorModel.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ created: 2, updated: 0 });
    });

    it('updates an existing donor when donorId matches', async () => {
      const existing: any = makeDonor({ donorId: 'EXT-001' });
      existing.update = jest.fn().mockResolvedValue(existing);
      donorModel.findOne.mockResolvedValue(existing);

      const dto = {
        donors: [{ donorId: 'EXT-001', firstName: 'Updated', lastName: 'Name' }],
      };

      const result = await service.bulkImport(dto as any, ORG_ID, USER_ID);

      expect(donorModel.findOne).toHaveBeenCalledWith({
        where: { donorId: 'EXT-001', organizationId: ORG_ID },
        transaction: t,
      });
      expect(existing.update).toHaveBeenCalledWith(
        { donorId: 'EXT-001', firstName: 'Updated', lastName: 'Name', organizationId: ORG_ID, updatedById: USER_ID },
        { transaction: t },
      );
      expect(donorModel.create).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 0, updated: 1 });
    });

    it('creates a donor when donorId is not found in the org', async () => {
      donorModel.findOne.mockResolvedValue(null);
      donorModel.create.mockResolvedValue(makeDonor({ donorId: 'NEW-001', contacts: [] }));

      const dto = {
        donors: [{ donorId: 'NEW-001', firstName: 'New', lastName: 'Donor' }],
      };

      const result = await service.bulkImport(dto as any, ORG_ID, USER_ID);

      expect(donorModel.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ created: 1, updated: 0 });
    });

    it('handles mixed create and update correctly', async () => {
      const existing: any = makeDonor({ donorId: 'EXT-001' });
      existing.update = jest.fn().mockResolvedValue(existing);
      donorModel.findOne
        .mockResolvedValueOnce(existing)  // EXT-001 found → update
        .mockResolvedValueOnce(null);     // EXT-002 not found → create
      donorModel.create.mockResolvedValue(makeDonor({ donorId: 'EXT-002', contacts: [] }));

      const dto = {
        donors: [
          { donorId: 'EXT-001', firstName: 'Alice', lastName: 'A' },
          { donorId: 'EXT-002', firstName: 'Bob', lastName: 'B' },
          { firstName: 'Carol', lastName: 'C' },
        ],
      };

      const result = await service.bulkImport(dto as any, ORG_ID, USER_ID);

      expect(donorModel.create).toHaveBeenCalledTimes(2);
      expect(existing.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ created: 2, updated: 1 });
    });
  });

  describe('remove', () => {
    it('destroys the donor', async () => {
      const donor: any = makeDonor();
      donor.destroy = jest.fn().mockResolvedValue(undefined);
      donorModel.findOne.mockResolvedValue(donor);

      await service.remove(donor.id, ORG_ID);

      expect(donor.destroy).toHaveBeenCalled();
    });

    it('throws NotFoundException when donor does not exist', async () => {
      donorModel.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
