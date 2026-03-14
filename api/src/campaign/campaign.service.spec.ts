import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Campaign } from '../models/campaign.model';
import { makeCampaign, CAMPAIGN_ID } from '../test/fixtures/campaign.fixture';
import { ORG_ID, USER_ID } from '../test/fixtures/user.fixture';
import { CampaignService } from './campaign.service';

describe('CampaignService', () => {
  let service: CampaignService;
  let campaignModel: { findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    campaignModel = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: getModelToken(Campaign), useValue: campaignModel },
      ],
    }).compile();

    service = module.get(CampaignService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('returns all campaigns for the organization', async () => {
      const campaigns = [makeCampaign(), makeCampaign({ id: 'other-id' })];
      campaignModel.findAll.mockResolvedValue(campaigns);

      const result = await service.findAll(ORG_ID);

      expect(campaignModel.findAll).toHaveBeenCalledWith({ where: { organizationId: ORG_ID } });
      expect(result).toEqual(campaigns);
    });
  });

  describe('findOne', () => {
    it('returns the campaign when found', async () => {
      const campaign = makeCampaign();
      campaignModel.findOne.mockResolvedValue(campaign);

      const result = await service.findOne(CAMPAIGN_ID, ORG_ID);

      expect(campaignModel.findOne).toHaveBeenCalledWith({ where: { id: CAMPAIGN_ID, organizationId: ORG_ID } });
      expect(result).toEqual(campaign);
    });

    it('throws NotFoundException when campaign does not exist', async () => {
      campaignModel.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and returns a new campaign', async () => {
      const dto = { name: 'Winter Drive', goalAmount: 10000, startDate: '2026-12-01', endDate: '2026-12-31' };
      const created = makeCampaign({ ...dto });
      campaignModel.create.mockResolvedValue(created);

      const result = await service.create(dto, ORG_ID, USER_ID);

      expect(campaignModel.create).toHaveBeenCalledWith({ ...dto, organizationId: ORG_ID, createdById: USER_ID, updatedById: USER_ID });
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('updates and returns the campaign', async () => {
      const dto = { name: 'Renamed Campaign', isActive: false };
      const campaign: any = makeCampaign();
      const updated = makeCampaign({ ...dto });
      campaign.update = jest.fn().mockResolvedValue(updated);
      campaignModel.findOne.mockResolvedValue(campaign);

      const result = await service.update(CAMPAIGN_ID, ORG_ID, dto, USER_ID);

      expect(campaign.update).toHaveBeenCalledWith({ ...dto, updatedById: USER_ID });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when campaign does not exist', async () => {
      campaignModel.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', ORG_ID, {}, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('destroys the campaign', async () => {
      const campaign: any = makeCampaign();
      campaign.destroy = jest.fn().mockResolvedValue(undefined);
      campaignModel.findOne.mockResolvedValue(campaign);

      await service.remove(CAMPAIGN_ID, ORG_ID);

      expect(campaign.destroy).toHaveBeenCalled();
    });

    it('throws NotFoundException when campaign does not exist', async () => {
      campaignModel.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent-id', ORG_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
