export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    PROFILE: "/auth/profile",
    CHANGE_PASSWORD: "/auth/change-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // Users
  USERS: {
    BASE: "/users",
    BY_ID: (id: string) => `/users/${id}`,
    TOGGLE_STATUS: (id: string) => `/users/${id}/toggle-status`,
    RESET_PASSWORD: (id: string) => `/users/${id}/reset-password`,
  },

  // Customers
  CUSTOMERS: {
    BASE: "/customers",
    BY_ID: (id: string) => `/customers/${id}`,
    TOGGLE_STATUS: (id: string) => `/customers/${id}/toggle-status`,
    SEARCH: "/customers/search",
    STATEMENT: (id: string) => `/customers/${id}/statement`,
    OUTSTANDING_BALANCE: "/customers/outstanding-balance",
    TOP_CUSTOMERS: "/customers/top-customers",
    CUSTOMER_DETAIL: (customerId: string) => `/customer-detail/${customerId}`,
  },

  // Products
  PRODUCTS: {
    BASE: "/products",
    BY_ID: (id: string) => `/products/${id}`,
    BY_SKU: (sku: string) => `/products/sku/${sku}`,
    TOGGLE_STATUS: (id: string) => `/products/${id}/toggle-status`,
    LOW_STOCK: "/products/low-stock",
  },

  // Product Categories
  CATEGORIES: {
    BASE: "/product-categories",
    BY_ID: (id: string) => `/product-categories/${id}`,
    HIERARCHY: "/product-categories/hierarchy",
    TOGGLE_STATUS: (id: string) => `/product-categories/${id}/toggle-status`,
  },

  // Brands
  BRANDS: {
    BASE: "/brands",
    BY_ID: (id: string) => `/brands/${id}`,
    TOGGLE_STATUS: (id: string) => `/brands/${id}/toggle-status`,
  },

  // Inventory
  INVENTORY: {
    BASE: "/inventory",
    BY_ID: (id: string) => `/inventory/${id}`,
    BY_PRODUCT: (productId: string) => `/inventory/product/${productId}`,
    ADJUST_STOCK: (id: string) => `/inventory/${id}/adjust-stock`,
    SUMMARY: "/inventory/summary",
    LOCATIONS: "/inventory/locations",
    LOW_STOCK: "/inventory/low-stock",
  },
  PRODUCT_BATCHES: {
    BASE: "/product-batches",
    BY_ID: (id: string) => `/product-batches/${id}`,
    AVAILABLE: (productId: string) => `/product-batches/available/${productId}`,
    EXPIRING: "/product-batches/expiring",
    FIFO: (productId: string, quantity: number) =>
      `/product-batches/fifo/${productId}/${quantity}`,
    ADJUST_STOCK: (id: string) => `/product-batches/${id}/adjust-stock`,
  },

  PAYMENTS: {
    BASE: "/payments",
    PAYMENT_METHODS: "/payments/payment-methods",
    PROCESS: "/payments/process",
    RECEIPTS: "/payments/receipts",
    RECEIPT_BY_ID: (id: string) => `/payments/receipts/${id}`,
    CUSTOMER_OUTSTANDING: (customerId: string) =>
      `/payments/customers/${customerId}/outstanding-invoices`,
  },

  TRANSACTIONS: {
    BASE: "/transactions",
    BY_ID: (id: string) => `/transactions/${id}`,
    SUMMARY: "/transactions/summary",
    CUSTOMER_STATEMENT: (customerId: string) =>
      `/transactions/customers/${customerId}/statement`,
  },

  // Payment Methods
  PAYMENT_METHODS: {
    BASE: "/payment-methods",
    BY_ID: (id: string) => `/payment-methods/${id}`,
    TOGGLE_STATUS: (id: string) => `/payment-methods/${id}/toggle-status`,
  },

  // Roles & Permissions
  ROLES: {
    BASE: "/roles",
    BY_ID: (id: string) => `/roles/${id}`,
  },

  PERMISSIONS: {
    BASE: "/permissions",
    BY_MODULE: (module: string) => `/permissions/modules/${module}`,
  },

  // Quotations
  QUOTATIONS: {
    BASE: "/quotations",
    BY_ID: (id: string) => `/quotations/${id}`,
    STATUS: (id: string) => `/quotations/${id}/status`,
    CONVERT_TO_INVOICE: (id: string) => `/quotations/${id}/convert-to-invoice`,
    SEARCH_PRODUCTS: "/quotations/search-products",
  },

  // Invoices
  INVOICES: {
    BASE: "/invoices",
    BY_ID: (id: string) => `/invoices/${id}`,
    STATUS: (id: string) => `/invoices/${id}/status`,
    CANCEL: (id: string) => `/invoices/${id}/cancel`,
    SUMMARY: "/invoices/summary",
    CREATE_FROM_JOB: (jobId: string) => `/invoices/create-from-job/${jobId}`,
    SEARCH_PRODUCTS: "/invoices/search-products",
    PDF: (id: string) => `/invoices/${id}/pdf`,
    SEND: (id: string) => `/invoices/${id}/send`,
  },
  DASHBOARD: {
    OVERVIEW: "/dashboard/overview",
  },

  SETTINGS: {
    BASE: "/settings",
    BY_ID: (id: string) => `/settings/${id}`,
    ALL: "/settings/all",
  },
  JOBS: {
    BASE: "/jobs",
    BY_ID: (id: string) => `/jobs/${id}`,
    WORKFLOW: (id: string) => `/jobs/${id}/workflow`,
    STATISTICS: "/jobs/statistics",
    ASSIGN: (id: string) => `/jobs/${id}/assign`,
    CANCEL: (id: string) => `/jobs/${id}/cancel`,
  },

  SUBSCRIPTIONS: {
    BASE: "/subscriptions",
    BY_ID: (id: string) => `/subscriptions/${id}`,
    BY_CUSTOMER: (customerId: string) =>
      `/subscriptions/customer/${customerId}`,
    CHECK_EXPIRY: "/subscriptions/check-expiry",
    STATS: "/subscriptions/dashboard-stats",
    GENERATE_RENEWAL_INVOICE: (id: string) =>
      `/subscriptions/${id}/generate-renewal-invoice`,
  },

  NOTIFICATIONS: {
    UNREAD: "/notifications/unread",
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/mark-all-read",
  },

  MIGRATION_UPLOAD: {
    BASE: "/migration-upload",
    VALIDATE_JOBS: "/migration-upload/jobs/validate",
    IMPORT_JOBS: "/migration-upload/jobs/import",
  },

  SMS: {
    SEND: "/sms/send",
    BALANCE: "/sms/balance",
    LOGS: "/sms/logs",
    STATS: "/sms/stats",
    TEST: "/sms/test",
  },


    // Departments
  DEPARTMENTS: {
    BASE: "/departments",
    BY_ID: (id: string) => `/departments/${id}`,
    ASSIGN_USER: "/departments/assign-user",
    REMOVE_USER: (departmentId: string, userId: string) =>
      `/departments/${departmentId}/users/${userId}`,
  },

  // CRM
  CRM: {
    DASHBOARD_MY: "/crm/dashboard/my",
    DASHBOARD_MANAGER: "/crm/dashboard/manager",

    INTERACTIONS: "/crm/interactions",
    INTERACTION_BY_ID: (id: string) => `/crm/interactions/${id}`,

    FOLLOWUPS: "/crm/followups",
    FOLLOWUP_BY_ID: (id: string) => `/crm/followups/${id}`,
    FOLLOWUP_COMPLETE: (id: string) => `/crm/followups/${id}/complete`,
    FOLLOWUP_MY_QUEUE: "/crm/followups/my-queue",

    ALERTS: "/crm/alerts",
    ALERT_BY_ID: (id: string) => `/crm/alerts/${id}`,
    ALERT_ACK: (id: string) => `/crm/alerts/${id}/acknowledge`,
    ALERT_RESOLVE: (id: string) => `/crm/alerts/${id}/resolve`,
  },

  // Tickets
  TICKETS: {
    BASE: "/tickets",
    BY_ID: (id: string) => `/tickets/${id}`,
    ASSIGN: (id: string) => `/tickets/${id}/assign`,
    STATUS: (id: string) => `/tickets/${id}/status`,
    COMMENTS: (id: string) => `/tickets/${id}/comments`,
  },

  // Feedback
  FEEDBACK: {
    BASE: "/feedback",
    BY_ID: (id: string) => `/feedback/${id}`,
    ACK: (id: string) => `/feedback/${id}/acknowledge`,
    RESOLVE: (id: string) => `/feedback/${id}/resolve`,
  },

  // Campaigns
  CAMPAIGNS: {
    BASE: "/campaigns",
    BY_ID: (id: string) => `/campaigns/${id}`,
    PREVIEW_RECIPIENTS: "/campaigns/preview-recipients",
    SCHEDULE: (id: string) => `/campaigns/${id}/schedule`,
  },

} as const;
