import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderService, Order } from './orderService';
import { customerService, Customer } from './customerService';

export const ORDERS_KEY = ['orders'] as const;
export const CUSTOMERS_KEY = ['customers'] as const;

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ORDERS_KEY,
    queryFn: () => orderService.findAll(),
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
  return () => queryClient.invalidateQueries({ queryKey: ORDERS_KEY });
}

export function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
}
