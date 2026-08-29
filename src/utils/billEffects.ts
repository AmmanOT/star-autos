import type { Bill, Customer, Product } from '../types';

/** Deduct stock when bill is created/updated; restore when reversed/deleted */
export function adjustStockForBill(products: Product[], bill: Bill, direction: 'apply' | 'reverse'): Product[] {
  const sign = direction === 'apply' ? -1 : 1;
  return products.map((p) => {
    const item = bill.items.find((i) => i.productId === p.id);
    if (!item) return p;
    return { ...p, quantity: Math.max(0, p.quantity + sign * item.quantity) };
  });
}

/** Add due to customer balance on sale; reverse on delete/edit rollback */
export function adjustCustomerBalanceForBill(customers: Customer[], bill: Bill, direction: 'apply' | 'reverse'): Customer[] {
  if (!bill.customerId) return customers;
  const due = bill.total - bill.paidAmount;
  const delta = direction === 'apply' ? due : -due;
  return customers.map((c) =>
    c.id === bill.customerId ? { ...c, balance: c.balance + delta } : c,
  );
}

/** Swap customer balance when a bill is edited (old customer → new customer) */
export function adjustCustomerBalanceOnEdit(customers: Customer[], oldBill: Bill, newBill: Bill): Customer[] {
  let updated = adjustCustomerBalanceForBill(customers, oldBill, 'reverse');
  updated = adjustCustomerBalanceForBill(updated, newBill, 'apply');
  return updated;
}

/** Available qty while editing = current stock + qty already on this bill */
export function availableQtyForEdit(product: Product, bill: Bill, productId: string): number {
  const onBill = bill.items.find((i) => i.productId === productId)?.quantity ?? 0;
  return product.quantity + onBill;
}

export function recalcBillTotals(items: Bill['items'], discount: number) {
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const total = Math.max(0, subtotal - discount);
  return { subtotal, total };
}
