import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { billsApi, customersApi, paymentsApi, productsApi } from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import type { AppState, Bill, Customer, Payment, Product } from '../types';
import {
  adjustCustomerBalanceForBill,
  adjustCustomerBalanceForPayment,
  adjustCustomerBalanceOnEdit,
  adjustStockForBill,
  patchList,
} from '../utils/billEffects';

type Action =
  | { type: 'ADD_PRODUCT'; payload: Omit<Product, 'id' | 'createdAt'> }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_CUSTOMER'; payload: Omit<Customer, 'id' | 'createdAt' | 'balance'> }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | {
      type: 'ADD_BILL';
      payload: {
        customerId?: string;
        customerName?: string;
        items: Bill['items'];
        subtotal: number;
        discount: number;
        total: number;
        paidAmount: number;
        paymentMethod: Bill['paymentMethod'];
        notes?: string;
      };
      idempotencyKey?: string;
    }
  | { type: 'UPDATE_BILL'; payload: Bill }
  | { type: 'DELETE_BILL'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: Omit<Payment, 'id' | 'createdAt'>; idempotencyKey?: string }
  | { type: 'DELETE_PAYMENT'; payload: string };

const emptyState: AppState = {
  products: [],
  customers: [],
  bills: [],
  payments: [],
};

const successMessage: Record<Action['type'], string> = {
  ADD_PRODUCT: 'Product saved',
  UPDATE_PRODUCT: 'Product updated',
  DELETE_PRODUCT: 'Product deleted',
  ADD_CUSTOMER: 'Customer saved',
  UPDATE_CUSTOMER: 'Customer updated',
  DELETE_CUSTOMER: 'Customer deleted',
  ADD_BILL: 'Bill created',
  UPDATE_BILL: 'Bill updated',
  DELETE_BILL: 'Bill deleted',
  ADD_PAYMENT: 'Payment recorded',
  DELETE_PAYMENT: 'Payment deleted, balance restored',
};

interface StoreContextValue {
  state: AppState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  dispatch: (action: Action) => Promise<unknown>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function stripProduct(p: Partial<Product>) {
  const { id: _id, createdAt: _c, ...rest } = p as Product;
  return rest;
}

function stripCustomer(c: Partial<Customer>) {
  const { id: _id, createdAt: _c, balance: _b, ...rest } = c as Customer;
  return rest;
}

function lockKey(action: Action): string | null {
  if ((action.type === 'ADD_BILL' || action.type === 'ADD_PAYMENT') && action.idempotencyKey) {
    return action.idempotencyKey;
  }
  if (action.type === 'UPDATE_BILL' || action.type === 'UPDATE_PRODUCT' || action.type === 'UPDATE_CUSTOMER') {
    return `${action.type}:${action.payload.id}`;
  }
  if (
    action.type === 'DELETE_BILL' ||
    action.type === 'DELETE_PRODUCT' ||
    action.type === 'DELETE_CUSTOMER' ||
    action.type === 'DELETE_PAYMENT'
  ) {
    return `${action.type}:${action.payload}`;
  }
  return null;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [state, setState] = useState<AppState>(emptyState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const inflight = useRef(new Map<string, Promise<unknown>>());

  const refresh = useCallback(async () => {
    if (!user) {
      setState(emptyState);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (user.role === 'customer') {
        const [products, customers] = await Promise.all([
          productsApi.list(),
          customersApi.list(),
        ]);
        setState((prev) => ({ ...prev, products, customers, bills: [], payments: [] }));
      } else {
        const [products, customers] = await Promise.all([
          productsApi.list(),
          customersApi.list(),
        ]);
        setState((prev) => ({ ...prev, products, customers }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is stable; avoid refresh loops
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = useCallback(async (action: Action) => {
    setError(null);
    const current = () => stateRef.current;
    try {
      let result: unknown;
      switch (action.type) {
        case 'ADD_PRODUCT': {
          const created = await productsApi.create(stripProduct(action.payload));
          setState((prev) => ({ ...prev, products: patchList(prev.products, created) }));
          result = created;
          break;
        }
        case 'UPDATE_PRODUCT': {
          const updated = await productsApi.update(action.payload.id, stripProduct(action.payload));
          setState((prev) => ({
            ...prev,
            products: prev.products.map((p) => (p.id === updated.id ? updated : p)),
          }));
          result = updated;
          break;
        }
        case 'DELETE_PRODUCT': {
          await productsApi.remove(action.payload);
          setState((prev) => ({
            ...prev,
            products: prev.products.filter((p) => p.id !== action.payload),
          }));
          break;
        }
        case 'ADD_CUSTOMER': {
          const created = await customersApi.create(action.payload);
          setState((prev) => ({ ...prev, customers: patchList(prev.customers, created) }));
          result = created;
          break;
        }
        case 'UPDATE_CUSTOMER': {
          const updated = await customersApi.update(action.payload.id, stripCustomer(action.payload));
          setState((prev) => ({
            ...prev,
            customers: prev.customers.map((c) => (c.id === updated.id ? updated : c)),
          }));
          result = updated;
          break;
        }
        case 'DELETE_CUSTOMER': {
          await customersApi.remove(action.payload);
          setState((prev) => ({
            ...prev,
            customers: prev.customers.filter((c) => c.id !== action.payload),
          }));
          break;
        }
        case 'ADD_BILL': {
          const created = await billsApi.create(action.payload, action.idempotencyKey);
          setState((prev) => ({
            products: adjustStockForBill(prev.products, created, 'apply'),
            customers: adjustCustomerBalanceForBill(prev.customers, created, 'apply'),
            bills: patchList(prev.bills, created),
            payments: prev.payments,
          }));
          result = created;
          break;
        }
        case 'UPDATE_BILL': {
          const oldBill =
            current().bills.find((b) => b.id === action.payload.id) ??
            (await billsApi.get(action.payload.id));
          const updated = await billsApi.update(action.payload.id, {
            customerId: action.payload.customerId,
            customerName: action.payload.customerName,
            items: action.payload.items,
            subtotal: action.payload.subtotal,
            discount: action.payload.discount,
            total: action.payload.total,
            paidAmount: action.payload.paidAmount,
            paymentMethod: action.payload.paymentMethod,
            notes: action.payload.notes,
          });
          setState((prev) => ({
            products: adjustStockForBill(
              adjustStockForBill(prev.products, oldBill, 'reverse'),
              updated,
              'apply',
            ),
            customers: adjustCustomerBalanceOnEdit(prev.customers, oldBill, updated),
            bills: prev.bills.map((b) => (b.id === updated.id ? updated : b)),
            payments: prev.payments,
          }));
          result = updated;
          break;
        }
        case 'DELETE_BILL': {
          const oldBill =
            current().bills.find((b) => b.id === action.payload) ??
            (await billsApi.get(action.payload));
          await billsApi.remove(action.payload);
          setState((prev) => ({
            products: adjustStockForBill(prev.products, oldBill, 'reverse'),
            customers: adjustCustomerBalanceForBill(prev.customers, oldBill, 'reverse'),
            bills: prev.bills.filter((b) => b.id !== action.payload),
            payments: prev.payments,
          }));
          break;
        }
        case 'ADD_PAYMENT': {
          const created = await paymentsApi.create(action.payload, action.idempotencyKey);
          setState((prev) => ({
            ...prev,
            customers: adjustCustomerBalanceForPayment(prev.customers, created, 'apply'),
            payments: patchList(prev.payments, created),
          }));
          result = created;
          break;
        }
        case 'DELETE_PAYMENT': {
          const oldPay = current().payments.find((p) => p.id === action.payload);
          await paymentsApi.remove(action.payload);
          setState((prev) => ({
            ...prev,
            customers: oldPay
              ? adjustCustomerBalanceForPayment(prev.customers, oldPay, 'reverse')
              : prev.customers,
            payments: prev.payments.filter((p) => p.id !== action.payload),
          }));
          break;
        }
        default:
          break;
      }
      toast.success(successMessage[action.type]);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed';
      setError(message);
      toast.error(message);
      throw err;
    }
  }, [toast]);

  const dispatch = useCallback(
    (action: Action) => {
      const key = lockKey(action);
      if (key) {
        const existing = inflight.current.get(key);
        if (existing) return existing;
      }
      const pending = runAction(action).finally(() => {
        if (key) inflight.current.delete(key);
      });
      if (key) inflight.current.set(key, pending);
      return pending;
    },
    [runAction],
  );

  const value = useMemo(
    () => ({ state, loading, error, refresh, dispatch }),
    [state, loading, error, refresh, dispatch],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
