import API from "./api";

/* =========================================================
   ⚠️ GET ALL VIOLATIONS
========================================================= */
export const getViolations = () =>
  API("/violations");

/* =========================================================
   ➕ CREATE VIOLATION (WITH MEDIA)
========================================================= */
export const createViolation = async (formData) => {
  const token = localStorage.getItem("token");

  const res = await fetch("/api/violations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return res.json();
};

/* =========================================================
   🔄 UPDATE VIOLATION (ADMIN)
========================================================= */
export const updateViolationStatus = (id, status) =>
  API(`/violations/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

/* =========================================================
   ❌ DELETE VIOLATION (ADMIN)
========================================================= */
export const deleteViolation = (id) =>
  API(`/violations/${id}`, {
    method: "DELETE",
  });

/* =========================================================
   🤖 GENERIC TEXT ENHANCE
========================================================= */
export const enhanceViolationText = (text) =>
  API("/violations/enhance-text", {
    method: "POST",
    body: { text },   // ✅ API utility will stringify and set Content-Type
  });