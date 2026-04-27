import API from "./api";

/* =========================================================
   🔔 GET ALL NOTIFICATIONS
========================================================= */
export const getNotifications = () =>
  API("/notifications");

/* =========================================================
   ✅ MARK ONE AS READ
========================================================= */
export const markNotificationAsRead = (id) =>
  API(`/notifications/${id}/read`, {
    method: "PUT",
  });

/* =========================================================
   ✅ MARK ALL AS READ
========================================================= */
export const markAllNotificationsAsRead = () =>
  API("/notifications/read-all", {
    method: "PUT",
  });

/* =========================================================
   ✅ MARK SELECTED AS READ
========================================================= */
export const markSelectedNotificationsAsRead = (ids) =>
  API("/notifications/read-selected", {
    method: "POST",
    body: { ids },               // ✅ plain object
  });

/* =========================================================
   ❌ DELETE ONE
========================================================= */
export const deleteNotification = (id) =>
  API(`/notifications/${id}`, {
    method: "DELETE",
  });

/* =========================================================
   ❌ DELETE SELECTED
========================================================= */
export const deleteSelectedNotifications = (ids) =>
  API("/notifications/delete-selected", {
    method: "POST",
    body: { ids },               // ✅ plain object
  });