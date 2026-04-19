import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '../main';
import { orderService, Order } from './orderService';
import { customerService, Customer } from './customerService';

export const ORDERS_KEY = ['orders'] as const;
export const ORDERS_INITIAL_KEY = ['orders-initial'] as const;
export const CUSTOMERS_KEY = ['customers'] as const;

const INITIAL_LIMIT = 100;
const FULL_LIMIT = 1000;

// Full order list — used by search/lookup hooks and as background cache.
// Uses GET_PAGE with a large limit so GET_ALL is never required.
export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_KEY,
    queryFn: () => orderService.findPaginated(FULL_LIMIT, 0),
  });
}

/**
 * Staged loading for fast first paint.
 * 1. Returns the first 100 orders immediately via GET_PAGE.
 * 2. Kicks off a larger GET_PAGE(1000) in the background to warm ORDERS_KEY.
 */
export function useInitialOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_INITIAL_KEY,
    queryFn: async () => {
      const initial = await orderService.findPaginated(INITIAL_LIMIT, 0);
      // Warm the full-list cache in the background
      orderService.findPaginated(FULL_LIMIT, 0).then((all) => {
        queryClient.setQueryData<Order[]>(ORDERS_KEY, all);
        // Upgrade the initial view to the full dataset silently
        queryClient.setQueryData<Order[]>(ORDERS_INITIAL_KEY, all);
      }).catch(() => {});
      return initial;
    },
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
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
