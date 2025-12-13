export const PERMISSIONS = {
  // Sales & Quotations
  SALES_VIEW: "sales.read",
  SALES_CREATE: "sales.create",
  SALES_UPDATE: "sales.update",
  SALES_DELETE: "sales.delete",

  QUOTATIONS_READ: "quotations.read",
  QUOTATIONS_CREATE: "quotations.create",
  QUOTATIONS_UPDATE: "quotations.update",
  QUOTATIONS_DELETE: "quotations.delete",

  // Invoices
  INVOICES_READ: "invoices.read",
  INVOICES_CREATE: "invoices.create",
  INVOICES_UPDATE: "invoices.update",
  INVOICES_DELETE: "invoices.delete",

  // Payments
  PAYMENTS_READ: "payments.read",
  PAYMENTS_CREATE: "payments.create",
  PAYMENTS_UPDATE: "payments.update",
  PAYMENTS_DELETE: "payments.delete",

  // Inventory
  INVENTORY_READ: "inventory.read",
  INVENTORY_CREATE: "inventory.create",
  INVENTORY_UPDATE: "inventory.update",
  INVENTORY_DELETE: "inventory.delete",
  INVENTORY_ADJUST: "inventory.adjust",

  // Products
  PRODUCTS_READ: "products.read",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",

  // Customers
  CUSTOMERS_READ: "customers.read",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",

  // Users & Roles
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",

  // Settings
  SETTINGS_READ: "settings.read",
  SETTINGS_UPDATE: "settings.update",

  // Subscriptions
  SUBSCRIPTIONS_READ: "subscriptions.read",
  SUBSCRIPTIONS_CREATE: "subscriptions.create",
  SUBSCRIPTIONS_UPDATE: "subscriptions.update",
  SUBSCRIPTIONS_DELETE: "subscriptions.delete",

  // Jobs & Vehicle Tracking
  JOBS_READ: "jobs.read",
  JOBS_CREATE: "jobs.create",
  JOBS_UPDATE: "jobs.update",
  JOBS_DELETE: "jobs.delete",

  VEHICLES_READ: "vehicles.read",
  VEHICLES_CREATE: "vehicles.create",
  VEHICLES_UPDATE: "vehicles.update",
  VEHICLES_DELETE: "vehicles.delete",

  TECHNICIANS_READ: "technicians.read",
  TECHNICIANS_CREATE: "technicians.create",
  TECHNICIANS_UPDATE: "technicians.update",
  TECHNICIANS_DELETE: "technicians.delete",

  REQUISITIONS_READ: "requisitions.read",
  REQUISITIONS_CREATE: "requisitions.create",
  REQUISITIONS_UPDATE: "requisitions.update",
  REQUISITIONS_DELETE: "requisitions.delete",

  INSPECTIONS_READ: "inspections.read",
  INSPECTIONS_CREATE: "inspections.create",
  INSPECTIONS_UPDATE: "inspections.update",
  INSPECTIONS_DELETE: "inspections.delete",

  // Reports & Transactions
  REPORTS_READ: "reports.read",
  TRANSACTIONS_READ: "transactions.read",
} as const;
