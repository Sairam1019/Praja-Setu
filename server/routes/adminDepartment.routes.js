import express from "express";
import {
  getDepartments,
  getDepartmentDetails
} from "../controllers/adminDepartment.controller.js";

import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================================================
   🏢 DEPARTMENT MANAGEMENT ROUTES
========================================================= */

/* ===========================
   📊 GET ALL DEPARTMENTS
=========================== */
router.get("/", authenticateUser, getDepartments);

/* ===========================
   📋 GET DEPARTMENT DETAIL
=========================== */
router.get("/:id", authenticateUser, getDepartmentDetails);

export default router;