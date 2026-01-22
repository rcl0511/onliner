const STORAGE_KEY = "invoice_statuses";

class InvoiceStatusService {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  getStatus(invoiceId) {
    const all = this.getAll();
    return all[invoiceId];
  }

  setStatus(invoiceId, status) {
    const all = this.getAll();
    const next = { ...all, [invoiceId]: status };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}

const invoiceStatusService = new InvoiceStatusService();
export default invoiceStatusService;
