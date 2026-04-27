import API from "./api";

/* =========================================================
   👤 USER RESOLVED
========================================================= */
export const getUserResolvedTasks = () =>
  API("/user/resolved");


/* =========================================================
   🛠 ADMIN RESOLVED
========================================================= */
export const getAdminResolvedTasks = () =>
  API("/admin/resolved");

export const getAdminResolvedDetail = (id) =>
  API(`/admin/resolved/${id}`);