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

export enum GroupEntityType {
  DONOR = 'donor',
  DONATION = 'donation',
}

@Table({ tableName: 'group', timestamps: true })
export class Group extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.TEXT })
  description: string;

  @Column({
    type: DataType.ENUM(...Object.values(GroupEntityType)),
    allowNull: false,
  })
  entityType: GroupEntityType;

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
}
