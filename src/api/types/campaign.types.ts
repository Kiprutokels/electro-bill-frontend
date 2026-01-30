export type Campaign = {
  id: string;
  campaignNumber: string;
  name: string;
  description?: string | null;
  channel: string;
  status: string;
  subject?: string | null;
  message: string;
  targetCriteria: string;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCampaignRequest = {
  name: string;
  description?: string;
  channel: string;
  subject?: string;
  message: string;
  targetCriteria?: any;
};

export type PreviewRecipientsRequest = any;

export type ScheduleCampaignRequest = {
  scheduledAt: string;
};
