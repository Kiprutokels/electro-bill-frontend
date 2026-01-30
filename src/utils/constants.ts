export const PERMISSIONS = {
  // Users
  USERS_CREATE: "users.create",
  USERS_READ: "users.read",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  // Customers
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",

  // Products
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_READ: "products.read",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",

  // Inventory
  INVENTORY_CREATE: "inventory.create",
  INVENTORY_READ: "inventory.read",
  INVENTORY_UPDATE: "inventory.update",
  INVENTORY_DELETE: "inventory.delete",

  // Sales
  SALES_CREATE: "sales.create",
  SALES_READ: "sales.read",
  SALES_UPDATE: "sales.update",
  SALES_DELETE: "sales.delete",

  // Payments
  PAYMENTS_CREATE: "payments.create",
  PAYMENTS_READ: "payments.read",
  PAYMENTS_UPDATE: "payments.update",
  PAYMENTS_DELETE: "payments.delete",

  // Reports
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",

  // Settings
  SETTINGS_CREATE: "settings.create",
  SETTINGS_READ: "settings.read",
  SETTINGS_UPDATE: "settings.update",
  SETTINGS_DELETE: "settings.delete",

  // Roles
  ROLES_CREATE: "roles.create",
  ROLES_READ: "roles.read",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",

  // Permissions
  PERMISSIONS_READ: "permissions.read",
  PERMISSIONS_ASSIGN: "permissions.assign",

  // Jobs
  JOBS_CREATE: "jobs.create",
  JOBS_READ: "jobs.read",
  JOBS_UPDATE: "jobs.update",
  JOBS_DELETE: "jobs.delete",
  JOBS_ASSIGN: "jobs.assign",

  // Technicians
  TECHNICIANS_CREATE: "technicians.create",
  TECHNICIANS_READ: "technicians.read",
  TECHNICIANS_UPDATE: "technicians.update",
  TECHNICIANS_DELETE: "technicians.delete",

  // Vehicles
  VEHICLES_CREATE: "vehicles.create",
  VEHICLES_READ: "vehicles.read",
  VEHICLES_UPDATE: "vehicles.update",
  VEHICLES_DELETE: "vehicles.delete",

  // Subscriptions
  SUBSCRIPTIONS_READ: "subscriptions.read",
  SUBSCRIPTIONS_CREATE: "subscriptions.create",
  SUBSCRIPTIONS_UPDATE: "subscriptions.update",
  SUBSCRIPTIONS_DELETE: "subscriptions.delete",

  // Processing Fees
  PROCESSING_FEES_READ: "processing_fees.read",
  PROCESSING_FEES_SETTLE: "processing_fees.settle",

  // REQUESTS
  ADVANCE_REQUESTS_CREATE: "advance_requests.create",
  ADVANCE_REQUESTS_READ: "advance_requests.read",
  ADVANCE_REQUESTS_APPROVE: "advance_requests.approve",
  ADVANCE_REQUESTS_DISBURSE: "advance_requests.disburse",

  SMS_SEND: "sms.send",
  SMS_READ: "sms.read",

  CRM_READ: "crm.read",

  CRM_INTERACTIONS_CREATE: "crm.interactions.create",
  CRM_INTERACTIONS_READ: "crm.interactions.read",

  CRM_FOLLOWUPS_CREATE: "crm.followups.create",
  CRM_FOLLOWUPS_READ: "crm.followups.read",
  CRM_FOLLOWUPS_UPDATE: "crm.followups.update",
  CRM_FOLLOWUPS_COMPLETE: "crm.followups.complete",

  CRM_ALERTS_READ: "crm.alerts.read",
  CRM_ALERTS_ACK: "crm.alerts.acknowledge",
  CRM_ALERTS_RESOLVE: "crm.alerts.resolve",

  CRM_DASHBOARD_READ: "crm.dashboard.read",
  CRM_DASHBOARD_MANAGER: "crm.dashboard.manager",

  TICKETS_CREATE: "tickets.create",
  TICKETS_READ: "tickets.read",
  TICKETS_UPDATE: "tickets.update",
  TICKETS_ASSIGN: "tickets.assign",
  TICKETS_COMMENT: "tickets.comment",
  TICKETS_CLOSE: "tickets.close",

  FEEDBACK_CREATE: "feedback.create",
  FEEDBACK_READ: "feedback.read",
  FEEDBACK_ACK: "feedback.acknowledge",
  FEEDBACK_RESOLVE: "feedback.resolve",

  CAMPAIGNS_CREATE: "campaigns.create",
  CAMPAIGNS_READ: "campaigns.read",
  CAMPAIGNS_UPDATE: "campaigns.update",
  CAMPAIGNS_SCHEDULE: "campaigns.schedule",
  CAMPAIGNS_SEND: "campaigns.send",

  DEPARTMENTS_CREATE: "departments.create",
  DEPARTMENTS_READ: "departments.read",
  DEPARTMENTS_UPDATE: "departments.update",
  DEPARTMENTS_ASSIGN: "departments.assign",
} as const;

export const APP_NAME = "ElectroBill";
export const APP_VERSION = "1.0.0";

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_DATA: "user_data",
  THEME: "theme",
} as const;

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  CUSTOMERS: "/customers",
  PRODUCTS: "/products",
  QUOTATIONS: "/quotations",
  INVENTORY: "/inventory",
  INVOICES: "/invoices",
  PAYMENTS: "/payments",
  TRANSACTIONS: "/transactions",
  REPORTS: "/reports",
  SETTINGS: "/settings",

  VEHICLES: "/vehicles",
  JOBS: "/jobs",
  TECHNICIANS: "/technicians",
  REQUISITIONS: "/requisitions",
  INSPECTIONS: "/inspections",
  ADVANCE_REQUESTS: "/advance-requests",
  PROFILE: "/profile",

  CRM_DASHBOARD: "/crm/dashboard",
  CRM_FOLLOWUPS: "/crm/followups",
  CRM_INTERACTIONS: "/crm/interactions",
  CRM_ALERTS: "/crm/alerts",
  TICKETS: "/tickets",
  FEEDBACK: "/feedback",
  CAMPAIGNS: "/campaigns",
  DEPARTMENTS: "/departments",
} as const;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
