import API from "./api";

/* =========================================================
   📋 GET ALL COMPLAINTS
========================================================= */
export const getComplaints = () =>
  API("/complaints");

/* =========================================================
   ➕ CREATE COMPLAINT (WITH MEDIA)
========================================================= */
export const createComplaint = async (formData) => {
  const token = localStorage.getItem("token");

  const res = await fetch("/api/complaints", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return res.json();
};

/* =========================================================
   🔄 UPDATE STATUS (ADMIN)
========================================================= */
export const updateComplaintStatus = (id, status) =>
  API(`/complaints/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

/* =========================================================
   🤖 ENHANCE DESCRIPTION (AI)
========================================================= */
export const enhanceComplaintDescription = (id) =>
  API(`/complaints/${id}/enhance`, {
    method: "POST",
  });

/* =========================================================
   🤖 GENERIC TEXT ENHANCE
========================================================= */
export const enhanceComplaintText = (text) =>
  API("/complaints/enhance-text", {
    method: "POST",
    body: { text },
  });