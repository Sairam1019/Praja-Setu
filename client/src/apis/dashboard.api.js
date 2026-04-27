import API from "./api";

/* =========================================================
   👤 USER DASHBOARD
========================================================= */

// 🌍 Global stats (no auth or optional auth)
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

export const getDepartmentDashboard = () =>
  API("/department/dashboard");

// 🧹 Clear recent activity for department user
export const clearDepartmentActivity = () =>
  API("/department/dashboard/clear-activity", {
    method: "DELETE",
  });


/* =========================================================
   🛠 ADMIN DASHBOARD
========================================================= */

export const getAdminStats = () =>
  API("/admin/dashboard/stats");

export const getComplaintTrends = () =>
  API("/admin/dashboard/complaint-trends");

export const getViolationTrends = () =>
  API("/admin/dashboard/violation-trends");

export const getActivitySummary = () =>
  API("/admin/dashboard/activity-summary");