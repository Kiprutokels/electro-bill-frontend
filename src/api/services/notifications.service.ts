import apiClient from "../client/axios";

export type NotificationChannel = "EMAIL" | "APP" | "SMS";
export type RecipientType = "TECHNICIAN" | "CUSTOMER" | "ADMIN";

export type NotificationType =
  | "JOB_ASSIGNMENT"
  | "JOB_REMINDER"
  | "CONSENT_REQUIRED"
  | "JOB_COMPLETION"
  | "INVOICE_GENERATED"
  | "JOB_RESCHEDULED"
  | "REQUISITION_APPROVED"
  | "ADVANCE_REQUEST_STATUS";

export interface JobNotification {
  id: string;
  jobId: string;
  recipientId: string;
  recipientType: RecipientType;
  notificationType: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  message: string;
  metadata?: any;
  sentAt: string;
  readAt?: string | null;
  success: boolean;
  errorMessage?: string | null;
  job?: {
    id: string;
    jobNumber: string;
    status: string;
    scheduledDate?: string | null;
  };
}

export const notificationsService = {
  getUnread: async (): Promise<JobNotification[]> => {
    const res = await apiClient.get<JobNotification[]>("/notifications/unread");
    return res.data;
  },

  markRead: async (id: string): Promise<JobNotification> => {
    const res = await apiClient.patch<JobNotification>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async (): Promise<{ count: number }> => {
    const res = await apiClient.patch<{ count: number }>(`/notifications/mark-all-read`);
    return res.data;
  },
};
