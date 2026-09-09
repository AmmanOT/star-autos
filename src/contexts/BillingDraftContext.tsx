import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { BillItem } from '../types';
import { useAuth } from './AuthContext';

export interface CartItem extends BillItem {
  maxQty: number;
}

export type DraftPaymentMethod = 'cash' | 'bank' | 'credit' | 'mixed';

export interface BillingDraft {
  cart: CartItem[];
  customerId: string;
  discount: number;
  paidAmount: number;
  paymentMethod: DraftPaymentMethod;
  notes: string;
}

interface BillingDraftContextValue {
  cart: CartItem[];
  customerId: string;
  discount: number;
  paidAmount: number;
  paymentMethod: DraftPaymentMethod;
  notes: string;
  addToCart: (item: CartItem) => void;
  updateQty: (productId: string, quantity: number) => void;
  bumpQty: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCustomerId: (id: string) => void;
  setDiscount: (n: number) => void;
  setPaidAmount: (n: number) => void;
  setPaymentMethod: (m: DraftPaymentMethod) => void;
  setNotes: (s: string) => void;
  clearDraft: () => void;
  syncCartStock: (products: Array<{ id: string; quantity: number }>) => void;
}

const DRAFT_KEY = 'star-autos-billing-draft';

const emptyDraft: BillingDraft = {
  cart: [],
  customerId: '',
  discount: 0,
  paidAmount: 0,
  paymentMethod: 'cash',
  notes: '',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const BillingDraftContext = createContext<BillingDraftContextValue | null>(null);

export function BillingDraftProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<BillingDraft>(() => readJson(DRAFT_KEY, emptyDraft));

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    if (!user) {
      setDraft(emptyDraft);
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [user]);

  const addToCart = useCallback((item: CartItem) => {
    setDraft((prev) => {
      const existing = prev.cart.find((i) => i.productId === item.productId);
      if (existing) {
        const quantity = Math.min(existing.maxQty, existing.quantity + 1);
        return {
          ...prev,
          cart: prev.cart.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity, total: quantity * i.unitPrice, maxQty: item.maxQty }
              : i,
          ),
        };
      }
      return { ...prev, cart: [...prev.cart, { ...item, quantity: 1, total: item.unitPrice }] };
    });
  }, []);

  const updateQty = useCallback((productId: string, quantity: number) => {
    setDraft((prev) => ({
      ...prev,
      cart: prev.cart.flatMap((i) => {
        if (i.productId !== productId) return [i];
        if (quantity <= 0) return [];
        const qty = Math.min(i.maxQty, quantity);
        return [{ ...i, quantity: qty, total: qty * i.unitPrice }];
      }),
    }));
  }, []);

  const bumpQty = useCallback((productId: string, delta: number) => {
    setDraft((prev) => ({
      ...prev,
      cart: prev.cart.flatMap((i) => {
        if (i.productId !== productId) return [i];
        const quantity = i.quantity + delta;
        if (quantity <= 0) return [];
        if (quantity > i.maxQty) return [i];
        return [{ ...i, quantity, total: quantity * i.unitPrice }];
      }),
    }));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setDraft((prev) => ({ ...prev, cart: prev.cart.filter((i) => i.productId !== productId) }));
  }, []);

  const clearCart = useCallback(() => {
    setDraft((prev) => ({ ...prev, cart: [] }));
  }, []);

  const setCustomerId = useCallback((customerId: string) => {
    setDraft((prev) => ({ ...prev, customerId }));
  }, []);

  const setDiscount = useCallback((discount: number) => {
    setDraft((prev) => ({ ...prev, discount: Number.isFinite(discount) ? discount : 0 }));
  }, []);

  const setPaidAmount = useCallback((paidAmount: number) => {
    setDraft((prev) => ({ ...prev, paidAmount: Number.isFinite(paidAmount) ? paidAmount : 0 }));
  }, []);

  const setPaymentMethod = useCallback((paymentMethod: DraftPaymentMethod) => {
    setDraft((prev) => ({ ...prev, paymentMethod }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setDraft((prev) => ({ ...prev, notes }));
  }, []);

  const clearDraft = useCallback(() => {
    setDraft(emptyDraft);
  }, []);

  const syncCartStock = useCallback((products: Array<{ id: string; quantity: number }>) => {
    if (products.length === 0) return;
    setDraft((prev) => {
      let changed = false;
      const cart = prev.cart.flatMap((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return [item];
        const maxQty = product.quantity;
        const quantity = Math.min(item.quantity, Math.max(0, maxQty));
        if (quantity <= 0) {
          changed = true;
          return [];
        }
        if (quantity !== item.quantity || maxQty !== item.maxQty) {
          changed = true;
          return [{ ...item, maxQty, quantity, total: quantity * item.unitPrice }];
        }
        return [item];
      });
      return changed ? { ...prev, cart } : prev;
    });
  }, []);

  const value = useMemo<BillingDraftContextValue>(
    () => ({
      cart: draft.cart,
      customerId: draft.customerId,
      discount: draft.discount,
      paidAmount: draft.paidAmount,
      paymentMethod: draft.paymentMethod,
      notes: draft.notes,
      addToCart,
      updateQty,
      bumpQty,
      removeItem,
      clearCart,
      setCustomerId,
      setDiscount,
      setPaidAmount,
      setPaymentMethod,
      setNotes,
      clearDraft,
      syncCartStock,
    }),
    [
      draft,
      addToCart,
      updateQty,
      bumpQty,
      removeItem,
      clearCart,
      setCustomerId,
      setDiscount,
      setPaidAmount,
      setPaymentMethod,
      setNotes,
      clearDraft,
      syncCartStock,
    ],
  );

  return <BillingDraftContext.Provider value={value}>{children}</BillingDraftContext.Provider>;
}

export function useBillingDraft() {
  const ctx = useContext(BillingDraftContext);
  if (!ctx) throw new Error('useBillingDraft must be used within BillingDraftProvider');
  return ctx;
}
