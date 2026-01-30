export type Ticket = {
  id: string;
  ticketNumber: string;
  customerId: string;
  subscriptionId?: string | null;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  attachments?: string | null; // JSON string
  assignedTo?: string | null;
  assignedDeptId?: string | null;
  assignedAt?: string | null;
  slaDeadline?: string | null;
  slaBreached: boolean;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  closedAt?: string | null;
  closedBy?: string | null;
  escalatedAt?: string | null;
  escalatedBy?: string | null;
  escalationReason?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  customer?: any;
  subscription?: any;
  assignedUser?: any;
  assignedDept?: any;
  creator?: any;

  comments?: TicketComment[];
  reassignments?: TicketReassignment[];
};

export type TicketComment = {
  id: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
  attachments?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  author?: any;
};

export type TicketReassignment = {
  id: string;
  ticketId: string;
  fromUserId?: string | null;
  toUserId?: string | null;
  fromDeptId?: string | null;
  toDeptId?: string | null;
  reason?: string | null;
  reassignedBy: string;
  reassignedAt: string;
  fromUser?: any;
  toUser?: any;
  fromDept?: any;
  toDept?: any;
  reassigner?: any;
};

export type CreateTicketRequest = {
  customerId: string;
  subscriptionId?: string;
  category: string;
  priority?: string;
  subject: string;
  description: string;
  attachments?: string[];
  assignedDeptId?: string;
  assignedTo?: string;
};

export type AssignTicketRequest = {
  assignedTo?: string;
  assignedDeptId?: string;
  reason?: string;
};

export type UpdateTicketStatusRequest = {
  status: string;
  resolutionNotes?: string;
  escalationReason?: string;
};

export type AddTicketCommentRequest = {
  content: string;
  isInternal?: boolean;
  attachments?: string[];
};
