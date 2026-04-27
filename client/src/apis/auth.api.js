import API from "./api";

/* =========================
   AUTH APIs
========================= */

// 🔐 Register
export const registerUser = (data) =>
  API("/auth/register", {
    method: "POST",
    body: data,               // 👈 no manual stringify
  });

// 🔐 Login
export const loginUser = (data) =>
  API("/auth/login", {
    method: "POST",
    body: data,               // 👈 no manual stringify
  });


