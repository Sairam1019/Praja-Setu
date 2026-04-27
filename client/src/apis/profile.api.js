import API from "./api";

/* =========================================================
   👤 GET PROFILE DATA
========================================================= */
export const getProfile = () =>
  API("/profile");