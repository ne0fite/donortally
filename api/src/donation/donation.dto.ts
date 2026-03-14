import { DonationStatus } from '../models/donation.model';

export class ImportDonationRowDto {
  donorId: string;
  donationId?: string;
  amount?: number;
  donationDate?: string;
  currency?: string;
  status?: DonationStatus;
  notes?: string;
  paymentType?: string;
  gift?: string;
  acknowledgedAt?: string | null;
}

export class ImportDonationsDto {
  donations: ImportDonationRowDto[];
}

export class CreateDonationDto {
  donorId: string;
  donationId?: string;
  campaignId?: string;
  amount: number;
  currency?: string;
  donationDate: string;
  status?: DonationStatus;
  notes?: string;
  acknowledgedAt?: string | null;
  paymentType?: string;
  gift?: string;
}

export class UpdateDonationDto {
  amount?: number;
  currency?: string;
  donationDate?: string;
  status?: DonationStatus;
  notes?: string;
  campaignId?: string;
  acknowledgedAt?: string | null;
  paymentType?: string;
  gift?: string;
}

export class BulkDeleteDonationsDto {
  ids: string[];
}
