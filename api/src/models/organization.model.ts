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
import { User } from './user.model';
import { Donor } from './donor.model';
import { Campaign } from './campaign.model';
import { Group } from './group.model';
import { Donation } from './donation.model';

@Table({ tableName: 'organization', timestamps: true })
export class Organization extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  slug: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

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

  @HasMany(() => User)
  users: User[];

  @HasMany(() => Donor)
  donors: Donor[];

  @HasMany(() => Campaign)
  campaigns: Campaign[];

  @HasMany(() => Group)
  groups: Group[];

  @HasMany(() => Donation)
  donations: Donation[];
}
