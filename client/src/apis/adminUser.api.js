import API from "./api";

/* =========================================================
   👥 GET ALL USERS (with optional role filter)
========================================================= */
export const getAllUsers = (role = null) =>
  API(role ? `/admin/users?role=${role}` : "/admin/users");

/* =========================================================
   ➕ CREATE USER (ADMIN)
========================================================= */
export const createUser = (data) =>
  API("/admin/users/create", {
    method: "POST",
    body: data,          // pass plain object; API will stringify
  });

/* =========================================================
   🚫 BLOCK / UNBLOCK USER
========================================================= */
export const toggleBlockUser = (id) =>
  API(`/admin/users/block/${id}`, {
    method: "PATCH",
  });

/* =========================================================
   ❌ DELETE USER
========================================================= */
export const deleteUser = (id) =>
  API(`/admin/users/${id}`, {
    method: "DELETE",
  });