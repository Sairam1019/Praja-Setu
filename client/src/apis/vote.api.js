import API from "./api";

/* =========================================================
   👍 VOTE COMPLAINT
========================================================= */
export const voteComplaint = (id) =>
  API(`/votes/complaint/${id}`, {
    method: "POST",
  });

/* =========================================================
   👍 VOTE VIOLATION
========================================================= */
export const voteViolation = (id) =>
  API(`/votes/violation/${id}`, {
    method: "POST",
  });