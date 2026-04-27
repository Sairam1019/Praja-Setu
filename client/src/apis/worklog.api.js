import API from "./api";

/* =========================================================
   📊 GET DEPARTMENT WORK LOGS
   optional filter: "all", "STATUS_UPDATE", "REJECTED", "REMARK"
========================================================= */
export const getWorkLogs = (filter = "all") =>
  API(`/department/work-logs?filter=${filter}`);