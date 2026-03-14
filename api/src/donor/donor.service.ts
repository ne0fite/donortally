import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'crypto';
import { Sequelize } from 'sequelize-typescript';
import { Donor } from '../models/donor.model';
import { DonorContact } from '../models/donor-contact.model';
import { Donation } from '../models/donation.model';
import { CreateDonorDto, ImportDonorsDto, MergeDonorsDto, UpdateDonorDto } from './donor.dto';

const WITH_CONTACTS = { include: [DonorContact] };

@Injectable()
export class DonorService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(Donor) private readonly donorModel: typeof Donor,
    @InjectModel(DonorContact) private readonly donorContactModel: typeof DonorContact,
    @InjectModel(Donation) private readonly donationModel: typeof Donation,
  ) {}

  findAll(organizationId: string): Promise<Donor[]> {
    return this.donorModel.findAll({ where: { organizationId }, ...WITH_CONTACTS });
  }

  async findOne(id: string, organizationId: string): Promise<Donor> {
    const donor = await this.donorModel.findOne({ where: { id, organizationId }, ...WITH_CONTACTS });
    if (!donor) throw new NotFoundException(`Donor ${id} not found`);
    return donor;
  }

  async create(dto: CreateDonorDto, organizationId: string, userId: string): Promise<Donor> {
    const { contacts, ...donorData } = dto;
    const donorId = donorData.donorId ?? `DR-${randomUUID().replace(/-/g, '').substring(0, 8)}`;

    const donor = await this.sequelize.transaction(async (t) => {
      const created = await this.donorModel.create(
        { ...donorData, donorId, organizationId, createdById: userId, updatedById: userId },
        { transaction: t },
      );

      if (contacts?.length) {
        await this.donorContactModel.bulkCreate(
          contacts.map((c) => ({ ...c, donorId: created.id, createdById: userId, updatedById: userId })),
          { transaction: t },
        );
      }

      return created;
    });

    return this.findOne(donor.id, organizationId);
  }

  async update(id: string, organizationId: string, dto: UpdateDonorDto, userId: string): Promise<Donor> {
    const donor = await this.findOne(id, organizationId);
    const { contacts, ...donorData } = dto;

    await this.sequelize.transaction(async (t) => {
      await donor.update({ ...donorData, updatedById: userId }, { transaction: t });

      if (contacts !== undefined) {
        await this.donorContactModel.destroy({ where: { donorId: id }, transaction: t });
        if (contacts.length) {
          await this.donorContactModel.bulkCreate(
            contacts.map((c) => ({ ...c, donorId: id, createdById: userId, updatedById: userId })),
            { transaction: t },
          );
        }
      }
    });

    return this.findOne(id, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const donor = await this.findOne(id, organizationId);
    await donor.destroy();
  }

  async merge(dto: MergeDonorsDto, organizationId: string, userId: string): Promise<void> {
    const { survivorId, ids } = dto;
    const donors = await this.donorModel.findAll({ where: { id: ids, organizationId } });
    if (donors.length !== ids.length) throw new BadRequestException('One or more donors not found');
    if (!ids.includes(survivorId)) throw new BadRequestException('survivorId must be in ids');

    const discardIds = ids.filter((id) => id !== survivorId);

    await this.sequelize.transaction(async (t) => {
      await this.donationModel.update(
        { donorId: survivorId, updatedById: userId },
        { where: { donorId: discardIds, organizationId }, transaction: t },
      );
      await this.donorContactModel.update(
        { donorId: survivorId },
        { where: { donorId: discardIds }, transaction: t },
      );
      await this.donorModel.update(
        {
          firstName: dto.firstName,
          lastName: dto.lastName,
          organizationName: dto.organizationName,
          address1: dto.address1,
          address2: dto.address2,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          updatedById: userId,
        },
        { where: { id: survivorId }, transaction: t },
      );
      await this.donorModel.destroy({ where: { id: discardIds, organizationId }, transaction: t });
    });
  }

  async bulkRemove(ids: string[], organizationId: string): Promise<void> {
    await this.sequelize.transaction(async (t) => {
      await this.donorContactModel.destroy({ where: { donorId: ids }, transaction: t });
      await this.donorModel.destroy({ where: { id: ids, organizationId }, transaction: t });
    });
  }

  async bulkImport(dto: ImportDonorsDto, organizationId: string, userId: string): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    await this.sequelize.transaction(async (t) => {
      for (const { contacts, ...donorData } of dto.donors) {
        if (donorData.donorId) {
          const existing = await this.donorModel.findOne({
            where: { donorId: donorData.donorId, organizationId },
            transaction: t,
          });

          if (existing) {
            await existing.update({ ...donorData, organizationId, updatedById: userId }, { transaction: t });
            updated++;
            continue;
          }
        }

        const donor = await this.donorModel.create(
          { ...donorData, organizationId, createdById: userId, updatedById: userId },
          { transaction: t },
        );
        if (contacts?.length) {
          await this.donorContactModel.bulkCreate(
            contacts.map((c) => ({ ...c, donorId: donor.id, createdById: userId, updatedById: userId })),
            { transaction: t },
          );
        }
        created++;
      }
    });

    return { created, updated };
  }
}
