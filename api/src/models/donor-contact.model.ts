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
import { Donor } from './donor.model';
import { User } from './user.model';

export enum DonorContactType {
  EMAIL = 'email',
  PHONE = 'phone',
  MOBILE = 'mobile',
}

export enum DonorContactLabel {
  HOME = 'home',
  WORK = 'work',
  OTHER = 'other',
}

@Table({ tableName: 'donor_contact', timestamps: true })
export class DonorContact extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @ForeignKey(() => Donor)
  @Column({ type: DataType.UUID, allowNull: false })
  donorId: string;

  @BelongsTo(() => Donor)
  donor: Donor;

  @Column({
    type: DataType.ENUM(...Object.values(DonorContactType)),
    allowNull: false,
  })
  type: DonorContactType;

  @Column({
    type: DataType.ENUM(...Object.values(DonorContactLabel)),
    allowNull: false,
  })
  label: DonorContactLabel;

  @Column({ type: DataType.STRING, allowNull: false })
  value: string;

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
