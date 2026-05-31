export interface CreateOrderInput {
  items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
  shippingAddress: string;
  totalAmount: number;
}

import { apiClient } from "./apiClient";

export const orderService = {
  async createOrder(input: CreateOrderInput) {
    const result = await apiClient.post<{ order: Record<string, any> }>("/api/orders", input);
    return { ...result.order, items: input.items };
  },
  async listMine() {
    const result = await apiClient.get<{ orders: Record<string, any>[] }>("/api/orders/mine");
    return result.orders;
  },
  async getById(id: string) {
    const result = await apiClient.get<{ order: Record<string, any> }>(`/api/orders/${encodeURIComponent(id)}`);
    return result.order;
  },
};
