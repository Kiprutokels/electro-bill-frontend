export { authService } from './auth.service';
export { usersService } from './users.service';
export { customersService } from './customers.service';
export { productsService } from './products.service';
export { inventoryService } from './inventory.service';
export { invoicesService } from './invoices.service';
export { paymentService } from './payment.service';
export { transactionsService } from './transactions.service';

export * from './technicians.service';
export * from './jobs.service';
export * from './vehicles.service';
export * from './inspections.service';
export * from './requisitions.service';   

// Export types
export type { User, CreateUserRequest, UpdateUserRequest } from './users.service';
export type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from './customers.service';
export type { Product, ProductCategory, CreateProductRequest, UpdateProductRequest } from './products.service';
export type { InventoryItem, InventorySummary } from './inventory.service';
export type { Invoice, InvoiceItem, CreateInvoiceRequest, UpdateInvoiceRequest } from './invoices.service';
export type { Receipt, PaymentMethod } from './payment.service';
export type { Transaction, TransactionSummary } from './transactions.service';
export type { Role, Permission } from './roles.service';
export type { CreateBrandRequest, UpdateBrandRequest } from './brands.service';
export type { CreateCategoryRequest, UpdateCategoryRequest } from './categories.service';