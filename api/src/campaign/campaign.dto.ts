export class CreateCampaignDto {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  goalAmount?: number;
  isActive?: boolean;
}

export class UpdateCampaignDto {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  goalAmount?: number;
  isActive?: boolean;
}
