import API from "./api";

/* =========================================================
   👤 USER DASHBOARD
========================================================= */

// 🌍 Global stats
export const getComplaintStats = () =>
  API("/dashboard/complaint-stats");

export const getViolationStats = () =>
  API("/dashboard/violation-stats");

export const getWeeklyTrend = () =>
  API("/dashboard/weekly-trend");

export const getStatusDistribution = () =>
  API("/dashboard/status-distribution");


/* =========================================================
   🏢 DEPARTMENT DASHBOARD
========================================================= */

// ✅ FIXED: removed extra /dashboard
export const getDepartmentDashboard = () =>
  API("/department");

// ✅ FIXED: removed duplicate /dashboard
export const clearDepartmentActivity = () =>
  API("/department/clear-activity", {
    method: "DELETE",
  });


/* =========================================================
   🛠 ADMIN DASHBOARD
========================================================= */

// ✅ These are already correct (match backend)
export const getAdminStats = () =>
  API("/admin/dashboard/stats");

export const getComplaintTrends = () =>
  API("/admin/dashboard/complaint-trends");

export const getViolationTrends = () =>
  API("/admin/dashboard/violation-trends");

export const getActivitySummary = () =>
  API("/admin/dashboard/activity-summary");