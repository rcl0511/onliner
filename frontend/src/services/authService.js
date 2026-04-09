import { http } from "../api/http";

export const loginHospital = async ({ phone, password }) => {
  const { data } = await http.post("/api/auth/login", {
    role: "hospital",
    phone,
    password,
  });
  return data;
};

export const loginVendor = async ({ companyCode, email, password }) => {
  const { data } = await http.post("/api/auth/login", {
    role: "vendor",
    companyCode,
    email,
    password,
  });
  return data;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  await http.put("/api/auth/password", {
    currentPassword,
    newPassword,
  });
};

const authService = {
  loginHospital,
  loginVendor,
  changePassword,
};

export default authService;
