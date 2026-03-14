import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Organization } from './organization.model';
import { User } from './user.model';
import { Donation } from './donation.model';

@Table({ tableName: 'campaign', timestamps: true })
export class Campaign extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.TEXT })
  description: string;

  @Column({ type: DataType.DATEONLY })
  startDate: string;

  @Column({ type: DataType.DATEONLY })
  endDate: string;

  @Column({ type: DataType.DECIMAL(12, 2) })
  goalAmount: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID, allowNull: false })
  organizationId: string;

  @BelongsTo(() => Organization)
  organization: Organization;

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

  @HasMany(() => Donation)
  donations: Donation[];
}
