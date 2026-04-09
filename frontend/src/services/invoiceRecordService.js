import { http } from "../api/http";

const BASE_URL = "/api/invoice-records";

const safeJsonParse = (value, fallback) => {
  if (!value) {
    return fallback;
  }
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapStatusToUi = (status) => {
  switch ((status || "").toUpperCase()) {
    case "SENT":
      return "unread";
    case "CONFIRMED":
      return "confirmed";
    case "DISPUTED":
      return "disputed";
    default:
      return (status || "unread").toLowerCase();
  }
};

const mapStatusToServer = (status) => {
  switch ((status || "").toLowerCase()) {
    case "confirmed":
      return "CONFIRMED";
    case "disputed":
      return "DISPUTED";
    case "unread":
      return "SENT";
    default:
      return status;
  }
};

const normalizeItem = (item = {}, index = 0) => {
  const quantity = Number(item.quantity || item.qty || item.count || 0);
  const unitPrice = Number(item.unitPrice || item.price || item.unit_price || 0);
  const total = Number(item.total || item.amount || quantity * unitPrice || 0);

  return {
    name: item.name || item.itemName || item.productName || `품목 ${index + 1}`,
    quantity,
    unit: item.unit || "개",
    unitPrice,
    total,
  };
};

const normalizeInvoice = (record = {}) => {
  const items = Array.isArray(record.items)
    ? record.items.map(normalizeItem)
    : safeJsonParse(record.items, []).map(normalizeItem);
  const createdDate = record.createdAt || record.confirmedAt || new Date().toISOString();

  return {
    ...record,
    date: createdDate,
    items,
    itemsCount: items.length,
    subtotal: Number(record.totalAmount || 0),
    tax: 0,
    total: Number(record.totalAmount || 0),
    status: mapStatusToUi(record.status),
    version: Number(record.version || 1),
    parentInvoiceId: record.parentInvoiceId || null,
    revisionNote: record.revisionNote || record.note || "",
  };
};

export const fetchHospitalInvoices = async () => {
  const { data } = await http.get(`${BASE_URL}/hospital`);
  return Array.isArray(data) ? data.map(normalizeInvoice) : [];
};

export const fetchVendorInvoices = async (status = "") => {
  const url = status
    ? `${BASE_URL}/vendor?status=${encodeURIComponent(status)}`
    : `${BASE_URL}/vendor`;
  const { data } = await http.get(url);
  return Array.isArray(data) ? data.map(normalizeInvoice) : [];
};

export const fetchInvoiceDetail = async (invoiceId) => {
  const { data } = await http.get(`${BASE_URL}/${invoiceId}`);
  return normalizeInvoice(data);
};

export const updateInvoiceStatus = async (invoiceId, status, options = {}) => {
  const payload = {
    status: mapStatusToServer(status),
    note: options.note || "",
    disputeType: options.disputeType || "",
    disputeMemo: options.disputeMemo || "",
  };

  const { data } = await http.put(`${BASE_URL}/${invoiceId}/status`, payload);
  return data;
};

const invoiceRecordService = {
  fetchHospitalInvoices,
  fetchVendorInvoices,
  fetchInvoiceDetail,
  updateInvoiceStatus,
};

export default invoiceRecordService;
