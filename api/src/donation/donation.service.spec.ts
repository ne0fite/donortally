import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Donation, DonationStatus } from '../models/donation.model';
import { Donor } from '../models/donor.model';
import { Campaign } from '../models/campaign.model';
import { makeDonation, CAMPAIGN_ID } from '../test/fixtures/donation.fixture';
import { ORG_ID, USER_ID } from '../test/fixtures/user.fixture';
import { DONOR_ID } from '../test/fixtures/donor.fixture';
import { DonationService } from './donation.service';

const WITH_RELATIONS = { include: [Donor, Campaign] };

describe('DonationService', () => {
  let service: DonationService;
  let donationModel: { findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    donationModel = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationService,
        { provide: getModelToken(Donation), useValue: donationModel },
      ],
    }).compile();

    service = module.get(DonationService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns donations with donor and campaign for the organization', async () => {
      const donations = [makeDonation(), makeDonation({ id: 'other-id' })];
      donationModel.findAll.mockResolvedValue(donations);

      const result = await service.findAll(ORG_ID);

      expect(donationModel.findAll).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
        ...WITH_RELATIONS,
      });
      expect(result).toEqual(donations);
      expect(result[0].donor).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('returns the donation with relations when found', async () => {
      const donation = makeDonation();
      donationModel.findOne.mockResolvedValue(donation);

      const result = await service.findOne(donation.id, ORG_ID);

      expect(donationModel.findOne).toHaveBeenCalledWith({
        where: { id: donation.id, organizationId: ORG_ID },
        ...WITH_RELATIONS,
      });
      expect(result).toEqual(donation);
      expect(result.donor).toBeDefined();
    });

    it('throws NotFoundException when donation does not exist', async () => {
      donationModel.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a donation without a campaign', async () => {
      const dto = { donorId: DONOR_ID, amount: 50, donationDate: '2026-03-07' };
      const created = makeDonation({ amount: 50 });
      donationModel.create.mockResolvedValue(created);

      const result = await service.create(dto, ORG_ID, USER_ID);

      expect(donationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...dto,
          organizationId: ORG_ID,
          createdById: USER_ID,
          updatedById: USER_ID,
          donationId: expect.stringMatching(/^DN-[a-f0-9]{8}$/i),
        }),
      );
      expect(result).toEqual(created);
    });

    it('creates a donation linked to a campaign', async () => {
      const dto = { donorId: DONOR_ID, campaignId: CAMPAIGN_ID, amount: 250, donationDate: '2026-03-07' };
      const created = makeDonation({ campaignId: CAMPAIGN_ID });
      donationModel.create.mockResolvedValue(created);

      const result = await service.create(dto, ORG_ID, USER_ID);

      expect(donationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          donationId: expect.stringMatching(/^DN-[a-f0-9]{8}$/i),
        }),
      );
      expect(result.campaignId).toBe(CAMPAIGN_ID);
    });
  });

  describe('update', () => {
    it('updates and returns the donation', async () => {
      const dto = { status: DonationStatus.REFUNDED, notes: 'Duplicate charge' };
      const donation: any = makeDonation();
      const updated = makeDonation({ ...dto });
      donation.update = jest.fn().mockResolvedValue(updated);
      donationModel.findOne.mockResolvedValue(donation);

      const result = await service.update(donation.id, ORG_ID, dto, USER_ID);

      expect(donation.update).toHaveBeenCalledWith({ ...dto, updatedById: USER_ID });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when donation does not exist', async () => {
      donationModel.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', ORG_ID, {}, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('destroys the donation', async () => {
      const donation: any = makeDonation();
      donation.destroy = jest.fn().mockResolvedValue(undefined);
      donationModel.findOne.mockResolvedValue(donation);

      await service.remove(donation.id, ORG_ID);

      expect(donation.destroy).toHaveBeenCalled();
    });

    it('throws NotFoundException when donation does not exist', async () => {
      donationModel.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
