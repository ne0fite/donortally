import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'crypto';
import { Sequelize } from 'sequelize-typescript';
import { Donation } from '../models/donation.model';
import { Donor } from '../models/donor.model';
import { Campaign } from '../models/campaign.model';
import { CreateDonationDto, ImportDonationsDto, UpdateDonationDto } from './donation.dto';

const WITH_RELATIONS = { include: [Donor, Campaign] };

@Injectable()
export class DonationService {
  constructor(
    @InjectModel(Donation) private readonly donationModel: typeof Donation,
    @InjectModel(Donor) private readonly donorModel: typeof Donor,
    private readonly sequelize: Sequelize,
  ) {}

  findAll(organizationId: string): Promise<Donation[]> {
    return this.donationModel.findAll({ where: { organizationId }, ...WITH_RELATIONS });
  }

  async findOne(id: string, organizationId: string): Promise<Donation> {
    const donation = await this.donationModel.findOne({
      where: { id, organizationId },
      ...WITH_RELATIONS,
    });
    if (!donation) throw new NotFoundException(`Donation ${id} not found`);
    return donation;
  }

  create(dto: CreateDonationDto, organizationId: string, userId: string): Promise<Donation> {
    const donationId = dto.donationId ?? `DN-${randomUUID().replace(/-/g, '').substring(0, 8)}`;
    return this.donationModel.create({ ...dto, donationId, organizationId, createdById: userId, updatedById: userId });
  }

  async update(id: string, organizationId: string, dto: UpdateDonationDto, userId: string): Promise<Donation> {
    const donation = await this.findOne(id, organizationId);
    return donation.update({ ...dto, updatedById: userId });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const donation = await this.findOne(id, organizationId);
    await donation.destroy();
  }

  async bulkRemove(ids: string[], organizationId: string): Promise<void> {
    await this.donationModel.destroy({ where: { id: ids, organizationId } });
  }

  async bulkImport(
    dto: ImportDonationsDto,
    organizationId: string,
    userId: string,
  ): Promise<{ created: number; updated: number; rejected: { donorId: string; reason: string }[] }> {
    const today = new Date().toISOString().slice(0, 10);
    let created = 0;
    let updated = 0;
    const rejected: { donorId: string; reason: string }[] = [];

    await this.sequelize.transaction(async (t) => {
      for (const row of dto.donations) {
        const donor = await this.donorModel.findOne({
          where: { donorId: row.donorId, organizationId },
          transaction: t,
        });

        if (!donor) {
          rejected.push({ donorId: row.donorId, reason: 'Donor not found' });
          continue;
        }

        const amount = row.amount != null ? Number(row.amount) : 0;
        const donationDate = row.donationDate || today;

        if (row.donationId) {
          const existing = await this.donationModel.findOne({
            where: { donationId: row.donationId, organizationId },
            transaction: t,
          });

          if (existing) {
            await existing.update(
              {
                amount,
                donationDate,
                currency: row.currency,
                status: row.status,
                notes: row.notes,
                paymentType: row.paymentType,
                gift: row.gift,
                acknowledgedAt: row.acknowledgedAt || null,
                updatedById: userId,
              },
              { transaction: t },
            );
            updated++;
            continue;
          }
        }

        const donationId = row.donationId || `DN-${randomUUID().replace(/-/g, '').substring(0, 8)}`;
        await this.donationModel.create(
          {
            donationId,
            donorId: donor.id,
            organizationId,
            amount,
            donationDate,
            currency: row.currency,
            status: row.status,
            notes: row.notes,
            paymentType: row.paymentType,
            gift: row.gift,
            acknowledgedAt: row.acknowledgedAt,
            createdById: userId,
            updatedById: userId,
          },
          { transaction: t },
        );
        created++;
      }
    });

    return { created, updated, rejected };
  }
}
