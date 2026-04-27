import API from "./api";

/* =========================================================
   📍 GET MY COMPLAINTS
========================================================= */
export const getMyComplaints = () =>
  API("/track/my-complaints");

/* =========================================================
   📍 GET MY VIOLATIONS
========================================================= */
export const getMyViolations = () =>
  API("/track/my-violations");

/* =========================================================
   🔍 GET TRACKING BY ID (IMPORTANT)
   type = "complaint" | "violation"
========================================================= */
export const getTrackingById = (type, id) =>
  API(`/track/${type}/${id}`);

/* =========================================================
   🔄 UPDATE TRACKING STATUS (DEPARTMENT)
========================================================= */
export const updateTracking = (id, data) =>
  API(`/track/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });