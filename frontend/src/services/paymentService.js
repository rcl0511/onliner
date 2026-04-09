import { http } from "../api/http";

export const fetchHospitalPayments = async () => {
  const { data } = await http.get("/api/payments/hospital");
  return data;
};

export const createPaymentOrder = async ({ invoiceRef, amount }) => {
  const { data } = await http.post("/api/payments/create", { invoiceRef, amount });
  return data;
};

export const confirmPayment = async ({ paymentKey, orderId, amount }) => {
  const { data } = await http.post("/api/payments/confirm", {
    paymentKey,
    orderId,
    amount,
  });
  return data;
};

const paymentService = {
  fetchHospitalPayments,
  createPaymentOrder,
  confirmPayment,
};

export default paymentService;
