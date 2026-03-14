import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Organization } from './organization.model';
import { User } from './user.model';
import { Donor } from './donor.model';
import { Campaign } from './campaign.model';

export enum DonationStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

@Table({ tableName: 'donation', timestamps: true })
export class Donation extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  amount: number;

  @Column({ type: DataType.STRING(3), defaultValue: 'USD' })
  currency: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  donationDate: string;

  @Column({
    type: DataType.ENUM(...Object.values(DonationStatus)),
    defaultValue: DonationStatus.COMPLETED,
  })
  status: DonationStatus;

  @Column({ type: DataType.TEXT })
  notes: string;

  @Column({ type: DataType.DATE, allowNull: true })
  acknowledgedAt: Date | null;

  @Column({ type: DataType.STRING, allowNull: false })
  donationId: string;

  @Column({ type: DataType.STRING, allowNull: true })
  paymentType: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  gift: string | null;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false })
  organizationId: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @ForeignKey(() => Donor)
  @Column({ type: DataType.UUID, allowNull: false })
  donorId: string;

  @BelongsTo(() => Donor)
  donor: Donor;

  @ForeignKey(() => Campaign)
  @Column({ type: DataType.UUID, allowNull: true })
  campaignId: string;

  @BelongsTo(() => Campaign)
  campaign: Campaign;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  createdById: string;

  @BelongsTo(() => User, 'createdById')
  createdBy: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: true })
  updatedById: string;

  @BelongsTo(() => User, 'updatedById')
  updatedBy: User;
}
