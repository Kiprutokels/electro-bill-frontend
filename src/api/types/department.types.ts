export type Department = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    tickets: number;
  };
};

export type AssignUserDepartmentRequest = {
  userId: string;
  departmentId: string;
  isPrimary: boolean;
};
