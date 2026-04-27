import express from "express";
import {
  getDepartmentProofs,
  getProofDetail,
  deleteProof
} from "../controllers/departmentProof.controller.js";

import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* =========================================================
   🔍 DEBUG LOGGER (OPTIONAL - REMOVE IN PROD)
========================================================= */
router.use((req, res, next) => {
  console.log(`👉 [PROOFS ROUTE] ${req.method} ${req.originalUrl}`);
  next();
});

/* =========================================================
   📸 GET ALL PROOFS (MUST BE FIRST)
========================================================= */
router.get("/",authenticateUser,getDepartmentProofs);

/* =========================================================
   🔍 GET SINGLE PROOF
========================================================= */
router.get("/:id",authenticateUser,getProofDetail);

/* =========================================================
   ❌ DELETE PROOF
========================================================= */
router.delete("/:id",authenticateUser,deleteProof);

export default router;