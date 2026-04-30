import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { queryClient } from '../main';
import { orderService, Order } from './orderService';
import { customerService, Customer } from './customerService';

// Module-level background loading tracker — avoids duplicate GET_PAGE calls
// when OrderRegistry mounts both useInitialOrders and useOrders simultaneously.
let bgLoading = false;
const bgListeners = new Set<() => void>();
function setBgLoading(val: boolean) {
  bgLoading = val;
  bgListeners.forEach((fn) => fn());
}

export function useIsBackgroundLoading(): boolean {
  const [loading, setLoading] = useState(bgLoading);
  useEffect(() => {
    const notify = () => setLoading(bgLoading);
    bgListeners.add(notify);
    return () => { bgListeners.delete(notify); };
  }, []);
  return loading;
}

export const ORDERS_KEY = ['orders'] as const;
export const ORDERS_INITIAL_KEY = ['orders-initial'] as const;
export const CUSTOMERS_KEY = ['customers'] as const;

const INITIAL_LIMIT = 100;
// Single background request fetches everything — avoids $skip pagination
// which is unreliable in SharePoint REST API.
const BG_FULL_LIMIT = 5000;

/**
 * Staged loading for fast first paint.
 * 1. GET_PAGE(100, 0)  → renders the table immediately (~2s).
 * 2. GET_PAGE(5000, 0) in background → single request gets all orders (~8-10s).
 *    Avoids $skip pagination which is unreliable in SharePoint REST API.
 */
export function useInitialOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_INITIAL_KEY,
    queryFn: async () => {
      const initial = await orderService.findPaginated(INITIAL_LIMIT, 0);
      setBgLoading(true);
      orderService.findPaginated(BG_FULL_LIMIT, 0).then((all) => {
        queryClient.setQueryData<Order[]>(ORDERS_KEY, all);
        queryClient.setQueryData<Order[]>(ORDERS_INITIAL_KEY, all);
      }).catch(() => {}).finally(() => setBgLoading(false));
      return initial;
    },
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000,
  });
}

// Full list — used by search/lookup hooks.
export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_KEY,
    queryFn: () => orderService.findPaginated(BG_FULL_LIMIT, 0),
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Finds a single customer from the cached list — instant if list is already loaded.
export function useCustomerById(id: number | undefined) {
  const { data: customers, isLoading, isError } = useCustomers();
  const data =
    (id !== undefined ? customers?.find((c) => c.id === id) : undefined) ?? null;
  return { data, isLoading, isError };
}
