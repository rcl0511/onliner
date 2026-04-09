import API_BASE from "../api/baseUrl";
import authFetch from "../api/authFetch";

const createObjectDownload = async (response, fileName) => {
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
};

export const uploadInvoicePdfs = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("invoices", file));

  const res = await authFetch(`${API_BASE}/api/invoices/upload-multiple`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`서버 오류 ${res.status}\n${errText}`);
  }

  const { files: uploaded } = await res.json();
  const timestamp = Date.now();
  return uploaded.map((file, index) => ({
    ...file,
    key: `auto-${timestamp}-${index}`,
    fileName: file.pdfFileName || file.pdfUrl.split("/").pop(),
  }));
};

export const downloadInvoicePdf = async (pdfUrl, fileName) => {
  if (!pdfUrl) {
    throw new Error("다운로드 가능한 PDF가 없습니다.");
  }

  const requestUrl = pdfUrl.startsWith("http") ? pdfUrl : `${API_BASE}${pdfUrl}`;
  const res = await authFetch(requestUrl);
  if (!res.ok) {
    throw new Error((await res.text()) || "PDF 다운로드에 실패했습니다.");
  }

  await createObjectDownload(res, fileName || "invoice.pdf");
};

const invoiceFileService = {
  uploadInvoicePdfs,
  downloadInvoicePdf,
};

export default invoiceFileService;
