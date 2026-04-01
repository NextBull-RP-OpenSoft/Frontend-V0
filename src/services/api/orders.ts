import { apiFetch } from './client';

export async function getOrders(page: number = 1, limit: number = 50): Promise<any> {
  const allOrders = await apiFetch('/api/v1/orders');
  // Workaround for missing Order History Pagination
  if (Array.isArray(allOrders)) {
    // Sort newer first theoretically, or leave as is payload
    const start = (page - 1) * limit;
    const paginated = allOrders.slice(start, start + limit);
    return { data: paginated, total: allOrders.length, page, limit };
  }
  return { data: [], total: 0, page, limit };
}

export async function getOrderById(orderId: string): Promise<any> {
  return apiFetch(`/api/v1/orders/${orderId}`);
}

export async function submitOrder(order: any): Promise<any> {
  return apiFetch('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function cancelOrder(orderId: string): Promise<any> {
  return apiFetch(`/api/v1/orders/${orderId}`, { method: 'DELETE' });
}

export async function amendOrder(orderId: string, updates: any): Promise<any> {
  return apiFetch(`/api/v1/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}
