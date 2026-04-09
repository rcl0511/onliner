import { http } from "../api/http";

const normalizeOrder = (order = {}) => ({
  ...order,
  items:
    typeof order.items === "string"
      ? (() => {
          try {
            return JSON.parse(order.items);
          } catch {
            return [];
          }
        })()
      : order.items || [],
  total: Number(order.totalAmount || 0),
  client: order.hospitalName || "병원",
});

export const createOrder = async (payload) => {
  const { data } = await http.post("/api/orders", payload);
  return data;
};

export const fetchVendorOrders = async () => {
  const { data } = await http.get("/api/orders");
  return Array.isArray(data) ? data.map(normalizeOrder) : [];
};

export const updateVendorOrderStatus = async (orderId, status) => {
  const { data } = await http.put(`/api/orders/${orderId}/status`, { status });
  return data;
};

const orderService = {
  createOrder,
  fetchVendorOrders,
  updateVendorOrderStatus,
};

export default orderService;
