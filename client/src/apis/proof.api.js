import API from "./api";

/* =========================================================
   📸 GET ALL PROOFS (DEPARTMENT USER)
========================================================= */
export const getDepartmentProofs = () =>
  API("/department/proofs");

/* =========================================================
   🔍 GET SINGLE PROOF DETAIL
========================================================= */
export const getProofDetail = (id) =>
  API(`/department/proofs/${id}`);

/* =========================================================
   ❌ DELETE PROOF
========================================================= */
export const deleteProof = (id) =>
  API(`/department/proofs/${id}`, {
    method: "DELETE",
  });