import API from "./api";

/* =========================================================
   🛠 ADMIN TASK APIs
========================================================= */

// Smart tasks
export const getSmartTasks = () =>
  API("/admin/tasks/smart-tasks");

// Department users load
export const getDeptUsers = () =>
  API("/admin/tasks/dept-users");

// Track task
export const getTaskTracking = (type, id) =>
  API(`/admin/tasks/track/${type}/${id}`);

// Assign – plain object (API will stringify)
export const assignTask = (data) =>
  API("/admin/tasks/assign", {
    method: "POST",
    body: data,
  });

// Reassign – plain object
export const reassignTask = (data) =>
  API("/admin/tasks/reassign", {
    method: "POST",
    body: data,
  });

// Toggle urgent – plain object
export const toggleUrgent = (data) =>
  API("/admin/tasks/toggle-urgent", {
    method: "POST",
    body: data,
  });

// Get detail
export const getAdminTaskDetail = (type, id) =>
  API(`/admin/tasks/${type}/${id}`);

// Delete
export const deleteTask = (type, id) =>
  API(`/admin/tasks/${type}/${id}`, {
    method: "DELETE",
  });

// Send reminder (email + notification)
export const sendTaskReminder = (type, id) =>
  API(`/admin/tasks/reminder/${type}/${id}`, {
    method: "POST",
  });

/* =========================================================
   🏢 DEPARTMENT TASK APIs
========================================================= */

// Assigned tasks (no /tasks)
export const getAssignedTasks = (filter = "all") =>
  API(`/department/assigned-tasks${filter !== "all" ? `?filter=${filter}` : ""}`);

// Task detail (no /tasks)
export const getDeptTaskDetail = (type, id) =>
  API(`/department/task/${type}/${id}`);

// Update status
export const updateTaskStatus = (data) =>
  API("/department/update-status", {
    method: "POST",
    body: data,
  });

// Reject task
export const rejectTask = (data) =>
  API("/department/reject-task", {
    method: "POST",
    body: data,
  });

// Add remark
export const addTaskRemark = (data) =>
  API("/department/add-remark", {
    method: "POST",
    body: data,
  });

// Submit proof (file upload – keep as fetch)
export const submitProof = async (formData) => {
  const token = localStorage.getItem("token");
  const res = await fetch("/api/department/submit-proof", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
};

// AI review (no /tasks)
export const aiTaskReview = (data) =>
  API("/department/ai-review", {
    method: "POST",
    body: data,
  });