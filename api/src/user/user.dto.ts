export class CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isSuperAdmin?: boolean;
}

export class UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  password?: string;
}
