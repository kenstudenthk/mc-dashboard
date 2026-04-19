import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '../main';
import { orderService, Order } from './orderService';
import { customerService, Customer } from './customerService';

export const ORDERS_KEY = ['orders'] as const;
export const ORDERS_INITIAL_KEY = ['orders-initial'] as const;
export const CUSTOMERS_KEY = ['customers'] as const;

const INITIAL_LIMIT = 100;
// GET_ALL times out in Power Automate (504) when dataset is large.
// Use a large GET_PAGE instead — OData $top/$skip returns only this batch,
// which SharePoint serves quickly and stays within the 2-min PA timeout.
const BACKGROUND_LIMIT = 1000;

// Full order list — uses GET_PAGE with a large limit to avoid GET_ALL 504 timeout.
export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_KEY,
    queryFn: () => orderService.findPaginated(BACKGROUND_LIMIT, 0),
  });
}

/**
 * Staged loading for fast first paint.
 * 1. GET_PAGE(100) → renders table immediately.
 * 2. GET_PAGE(1000) in background → upgrades cache to full dataset silently.
 *    Avoids GET_ALL which causes a 504 timeout in Power Automate.
 */
export function useInitialOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_INITIAL_KEY,
    queryFn: async () => {
      const initial = await orderService.findPaginated(INITIAL_LIMIT, 0);
      orderService.findPaginated(BACKGROUND_LIMIT, 0).then((all) => {
        queryClient.setQueryData<Order[]>(ORDERS_KEY, all);
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
