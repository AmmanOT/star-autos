import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { billsApi, customersApi, paymentsApi, productsApi } from '../api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import type { AppState, Bill, Customer, Payment, Product } from '../types';

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
    }
  | { type: 'UPDATE_BILL'; payload: Bill }
  | { type: 'DELETE_BILL'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: Omit<Payment, 'id' | 'createdAt'> };

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
  const { id: _id, createdAt: _c, ...rest } = c as Customer;
  return rest;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [state, setState] = useState<AppState>(emptyState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setState(emptyState);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [products, customers, bills, payments] = await Promise.all([
        productsApi.list(),
        customersApi.list(),
        billsApi.list(),
        paymentsApi.list(),
      ]);
      setState({ products, customers, bills, payments });
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

  const dispatch = useCallback(
    async (action: Action) => {
      setError(null);
      try {
        let result: unknown;
        switch (action.type) {
          case 'ADD_PRODUCT':
            result = await productsApi.create(stripProduct(action.payload));
            break;
          case 'UPDATE_PRODUCT':
            result = await productsApi.update(action.payload.id, stripProduct(action.payload));
            break;
          case 'DELETE_PRODUCT':
            await productsApi.remove(action.payload);
            break;
          case 'ADD_CUSTOMER':
            result = await customersApi.create(action.payload);
            break;
          case 'UPDATE_CUSTOMER':
            result = await customersApi.update(action.payload.id, stripCustomer(action.payload));
            break;
          case 'DELETE_CUSTOMER':
            await customersApi.remove(action.payload);
            break;
          case 'ADD_BILL':
            result = await billsApi.create(action.payload);
            break;
          case 'UPDATE_BILL': {
            const { id, billNumber: _bn, createdAt: _ca, createdBy: _cb, ...body } = action.payload;
            result = await billsApi.update(id, body);
            break;
          }
          case 'DELETE_BILL':
            await billsApi.remove(action.payload);
            break;
          case 'ADD_PAYMENT':
            result = await paymentsApi.create(action.payload);
            break;
          default:
            break;
        }
        await refresh();
        toast.success(successMessage[action.type]);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Action failed';
        setError(message);
        toast.error(message);
        throw err;
      }
    },
    [refresh, toast],
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
