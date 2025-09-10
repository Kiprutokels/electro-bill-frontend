export const currencies = {
  KES: { symbol: 'KSh', name: 'Kenyan Shilling', code: 'KES' },
  USD: { symbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP' },
};

export const formatCurrency = (
  amount: number,
  currencyCode: keyof typeof currencies = 'KES'
): string => {
  const currency = currencies[currencyCode];
  return `${currency.symbol} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const parseCurrency = (currencyString: string): number => {
  const numericString = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(numericString) || 0;
};

export const calculateTax = (amount: number, taxRate: number): number => {
  return (amount * taxRate) / 100;
};

export const calculateDiscount = (amount: number, discountPercentage: number): number => {
  return (amount * discountPercentage) / 100;
};

export const calculateTotal = (
  subtotal: number,
  taxRate: number = 0,
  discountPercentage: number = 0
): {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  tax: number;
  total: number;
} => {
  const discount = calculateDiscount(subtotal, discountPercentage);
  const taxableAmount = subtotal - discount;
  const tax = calculateTax(taxableAmount, taxRate);
  const total = taxableAmount + tax;

  return {
    subtotal,
    discount,
    taxableAmount,
    tax,
    total,
  };
};
