import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '../main';
import { orderService, Order } from './orderService';
import { customerService, Customer } from './customerService';

export const ORDERS_KEY = ['orders'] as const;
export const ORDERS_INITIAL_KEY = ['orders-initial'] as const;
export const CUSTOMERS_KEY = ['customers'] as const;

const INITIAL_LIMIT = 100;
// Each background page is small enough to complete within PA's 2-min timeout.
// With ~1000 total orders this means ~5 background requests of 200 each.
const BG_PAGE_SIZE = 200;

// Fetches all remaining pages starting from `startOffset`, sequentially.
async function fetchRemainingPages(startOffset: number): Promise<Order[]> {
  const collected: Order[] = [];
  let offset = startOffset;
  while (true) {
    const page = await orderService.findPaginated(BG_PAGE_SIZE, offset);
    if (page.length === 0) break;
    collected.push(...page);
    if (page.length < BG_PAGE_SIZE) break; // reached last page
    offset += BG_PAGE_SIZE;
  }
  return collected;
}

/**
 * Staged loading for fast first paint.
 * 1. GET_PAGE(100, 0)  → renders the table immediately.
 * 2. Sequential GET_PAGE(200, 100), GET_PAGE(200, 300), … in background
 *    → each small request avoids the PA 504 timeout; cache upgrades silently.
 */
export function useInitialOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_INITIAL_KEY,
    queryFn: async () => {
      const initial = await orderService.findPaginated(INITIAL_LIMIT, 0);
      fetchRemainingPages(INITIAL_LIMIT).then((rest) => {
        const all = [...initial, ...rest];
        queryClient.setQueryData<Order[]>(ORDERS_KEY, all);
        queryClient.setQueryData<Order[]>(ORDERS_INITIAL_KEY, all);
      }).catch(() => {});
      return initial;
    },
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });
}

// Full list via sequential GET_PAGE — used by search/lookup hooks.
export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_KEY,
    queryFn: async () => {
      const first = await orderService.findPaginated(BG_PAGE_SIZE, 0);
      if (first.length < BG_PAGE_SIZE) return first;
      const rest = await fetchRemainingPages(BG_PAGE_SIZE);
      return [...first, ...rest];
    },
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
