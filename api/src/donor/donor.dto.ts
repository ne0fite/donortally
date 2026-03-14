import { DonorContactLabel, DonorContactType } from '../models/donor-contact.model';

export class DonorContactDto {
  type: DonorContactType;
  label: DonorContactLabel;
  value: string;
}

export class CreateDonorDto {
  donorId?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  contacts?: DonorContactDto[];
}

export class ImportDonorRowDto {
  donorId?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  contacts?: DonorContactDto[];
}

export class ImportDonorsDto {
  donors: ImportDonorRowDto[];
}

export class BulkDeleteDonorsDto {
  ids: string[];
}

export class MergeDonorsDto {
  survivorId: string;
  ids: string[];
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export class UpdateDonorDto {
  donorId?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  contacts?: DonorContactDto[];
}
