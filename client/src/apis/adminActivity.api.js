import API from "./api";

/* =========================================================
   📊 GET ADMIN ACTIVITY LOGS
========================================================= */
export const getAdminActivity = () =>
  API("/admin/activity");

/* =========================================================
   🚫 BLOCK USER
========================================================= */
export const blockUser = (userId) =>
  API("/admin/activity/block", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });

/* =========================================================
   ✅ UNBLOCK USER
========================================================= */
export const unblockUser = (userId) =>
  API("/admin/activity/unblock", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });

/* =========================================================
   ❌ DELETE USER
========================================================= */
export const deleteUserByAdmin = (userId) =>
  API("/admin/activity/delete-user", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });

/* =========================================================
   🧹 CLEAR LOGS
========================================================= */
export const clearLogs = () =>
  API("/admin/activity/clear-logs", {
    method: "POST",
  });