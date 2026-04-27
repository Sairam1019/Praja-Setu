import API from "./api";

/* =========================================================
   🏢 GET ALL DEPARTMENTS
========================================================= */
export const getDepartments = () =>
  API("/admin/departments");

/* =========================================================
   📋 GET DEPARTMENT DETAILS
========================================================= */
export const getDepartmentDetails = (id) =>
  API(`/admin/departments/${id}`);