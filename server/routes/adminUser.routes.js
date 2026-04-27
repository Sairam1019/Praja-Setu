import express from "express";

import {
  getAllUsers,
  createUserByAdmin,
  toggleBlockUser,
  deleteUser
} from "../controllers/adminUser.controller.js";

import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ===========================
   👥 GET USERS
=========================== */
router.get("/", authenticateUser, getAllUsers);

/* ===========================
   ➕ CREATE
=========================== */
router.post("/create", authenticateUser, createUserByAdmin);

/* ===========================
   🚫 BLOCK
=========================== */
router.patch("/block/:id", authenticateUser, toggleBlockUser);

/* ===========================
   ❌ DELETE
=========================== */
router.delete("/:id", authenticateUser, deleteUser);

export default router;