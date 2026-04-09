import { http } from "../api/http";

export const fetchHospitalDashboard = async () => {
  const { data } = await http.get("/api/dashboard/hospital");
  return data;
};

export const fetchVendorDashboard = async () => {
  const { data } = await http.get("/api/dashboard/vendor");
  return data;
};

const dashboardService = {
  fetchHospitalDashboard,
  fetchVendorDashboard,
};

export default dashboardService;
