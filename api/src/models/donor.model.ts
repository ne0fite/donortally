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
import { DonorContact } from './donor-contact.model';

@Table({
  tableName: 'donor',
  timestamps: true,
  indexes: [{ unique: true, fields: ['donorId', 'organizationId'] }],
})
export class Donor extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Column({ type: DataType.STRING, allowNull: true })
  donorId: string;

  @Column({ type: DataType.STRING, allowNull: true })
  title: string;

  @Column({ type: DataType.STRING, allowNull: true })
  firstName: string;

  @Column({ type: DataType.STRING, allowNull: true })
  lastName: string;

  @Column({ type: DataType.STRING })
  organizationName: string;

  @Column({ type: DataType.STRING })
  address1: string;

  @Column({ type: DataType.STRING })
  address2: string;

  @Column({ type: DataType.STRING })
  city: string;

  @Column({ type: DataType.STRING })
  state: string;

  @Column({ type: DataType.STRING })
  postalCode: string;

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

  @HasMany(() => DonorContact)
  contacts: DonorContact[];

  @HasMany(() => Donation)
  donations: Donation[];
}
