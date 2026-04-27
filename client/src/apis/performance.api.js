import API from "./api";

/* =========================================================
   🛠 ADMIN PERFORMANCE
========================================================= */

// 🌍 Global performance dashboard
export const getAdminPerformance = () =>
  API("/admin/performance");

// 🏢 Department-specific performance
export const getDepartmentPerformanceByAdmin = (id) =>
  API(`/admin/performance/${id}`);


/* =========================================================
   🏢 DEPARTMENT PERFORMANCE
========================================================= */

// Logged-in department performance
export const getDepartmentPerformance = () =>
  API("/department/performance");