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

@Table({
  tableName: 'user',
  timestamps: true,
  defaultScope: { attributes: { exclude: ['password'] } },
})
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  password: string;

  @Column({ type: DataType.STRING, allowNull: false })
  firstName: string;

  @Column({ type: DataType.STRING, allowNull: false })
  lastName: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isSuperAdmin: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: true })
  isActive: boolean;

  @ForeignKey(() => Organization)
  @Column({ type: DataType.UUID })
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
