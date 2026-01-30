export type Feedback = {
  id: string;
  subscriptionId: string;
  customerId: string;
  satisfactionScore: number;
  recommendationScore: number;
  productQualityScore?: number | null;
  serviceQualityScore?: number | null;
  category: string;
  improvements?: string | null;
  positiveComments?: string | null;
  negativeComments?: string | null;
  submittedBy?: string | null;
  submittedVia: string;
  isAnonymous: boolean;
  requiresAttention: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  resolution?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  customer?: any;
  subscription?: any;
};

export type CreateFeedbackRequest = {
  subscriptionId: string;
  customerId: string;
  satisfactionScore: number;
  recommendationScore: number;
  productQualityScore?: number;
  serviceQualityScore?: number;
  category: string;
  improvements?: string;
  positiveComments?: string;
  negativeComments?: string;
  submittedVia?: string;
  isAnonymous?: boolean;
};
