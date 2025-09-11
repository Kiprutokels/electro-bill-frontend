export const PERMISSIONS = {
  SALES: {
    VIEW: 'sales.view',
    CREATE: 'sales.create',
    UPDATE: 'sales.update',
    DELETE: 'sales.delete',
    CONVERT: 'sales.convert',
  },
  INVENTORY: {
    VIEW: 'inventory.view',
    CREATE: 'inventory.create',
    UPDATE: 'inventory.update',
    DELETE: 'inventory.delete',
    ADJUST: 'inventory.adjust',
    EXPORT: 'inventory.export'
  },
  
  QUOTATIONS: {
    VIEW: 'quotations.view',
    CREATE: 'quotations.create',
    UPDATE: 'quotations.update',
    DELETE: 'quotations.delete',
    CONVERT: 'quotations.convert_to_invoice',
    EXPORT: 'quotations.export'
  },
  
  INVOICES: {
    VIEW: 'invoices.view',
    CREATE: 'invoices.create',
    UPDATE: 'invoices.update',
    DELETE: 'invoices.delete',
    PAYMENT: 'invoices.record_payment',
    EXPORT: 'invoices.export'
  }
  
} as const;
