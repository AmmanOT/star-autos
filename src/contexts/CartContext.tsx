import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CartLine {
  productId: string;
  name: string;
  nameUrdu: string;
  partNumber: string;
  unitPrice: number;
  quantity: number;
  maxQty: number;
}

interface CartContextValue {
  items: CartLine[];
  addItem: (item: Omit<CartLine, 'quantity'> & { quantity?: number }) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CART_KEY = 'suzuki-shop-cart';
const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<CartLine, 'quantity'> & { quantity?: number }) => {
    const qty = item.quantity ?? 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        const newQty = Math.min(existing.maxQty, existing.quantity + qty);
        if (newQty <= 0) return prev.filter((i) => i.productId !== item.productId);
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: newQty } : i,
        );
      }
      return [...prev, { ...item, quantity: Math.min(qty, item.maxQty) }];
    });
  };

  const updateQty = (productId: string, qty: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.productId !== productId) return [i];
        if (qty <= 0) return [];
        return [{ ...i, quantity: Math.min(qty, i.maxQty) }];
      }),
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clearCart, totalItems, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
