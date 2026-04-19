import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '../main';
import { orderService, Order } from './orderService';
import { customerService, Customer } from './customerService';

export const ORDERS_KEY = ['orders'] as const;
export const ORDERS_INITIAL_KEY = ['orders-initial'] as const;
export const CUSTOMERS_KEY = ['customers'] as const;

const INITIAL_LIMIT = 100;

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_KEY,
    queryFn: () => orderService.findAll(),
  });
}

/**
 * Staged loading for fast first paint.
 * 1. Immediately shows the first 100 orders (cached indefinitely until invalidate).
 * 2. Silently loads ALL orders in the background and merges into the same cache key.
 * Uses staleTime:Infinity so the initial 100 never trigger a refetch on mount.
 */
export function useInitialOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_INITIAL_KEY,
    queryFn: async () => {
      const [initial, all] = await Promise.all([
        orderService.findPaginated(INITIAL_LIMIT, 0),
        orderService.findAll(),
      ]);
      // Merge into main cache so other consumers get the full list
      queryClient.setQueryData<Order[]>(ORDERS_KEY, all);
      return initial;
    },
    staleTime: Infinity,      // Never auto-refetch initial 100
    gcTime: 10 * 60 * 1000,   // 10 min cache
    placeholderData: undefined,
  });
}

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: CUSTOMERS_KEY,
    queryFn: () => customerService.findAll(),
  });
}

export function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
    queryClient.invalidateQueries({ queryKey: ORDERS_INITIAL_KEY });
  };
}

export function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
}

// Finds a single order from the cached list — instant if list is already loaded.
export function useOrderByTitle(titleOrId: string | undefined) {
  const { data: orders, isLoading, isError } = useOrders();
  if (!titleOrId) return { data: null, isLoading, isError };
  const isNumeric = /^\d+$/.test(titleOrId);
  const data =
    orders?.find((o) =>
      isNumeric ? o.id === parseInt(titleOrId, 10) : o.Title === titleOrId,
    ) ?? null;
  return { data, isLoading, isError };
}

// Fetches a single order directly via GET_BY_ID — does NOT load all orders.
export function useOrderById(id: number | undefined) {
  return useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => orderService.findById(id!),
    enabled: id !== undefined,
  });
}

// Finds a single customer from the cached list — instant if list is already loaded.
export function useCustomerById(id: number | undefined) {
  const { data: customers, isLoading, isError } = useCustomers();
  const data =
    (id !== undefined ? customers?.find((c) => c.id === id) : undefined) ?? null;
  return { data, isLoading, isError };
}
