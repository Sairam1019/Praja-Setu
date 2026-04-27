import express from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";
import { getProfileData } from "../controllers/profile.controller.js";

const router = express.Router();

/* 🔐 ALL ROUTES PROTECTED */
router.use(authenticateUser);

/* 👤 GET PROFILE */
router.get("/", getProfileData);

export default router;