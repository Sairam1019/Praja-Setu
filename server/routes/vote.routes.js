import express from "express";
import {
  voteComplaint,
  voteViolation
} from "../controllers/vote.controller.js";

import { authenticateUser } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/complaint/:id", authenticateUser, voteComplaint);
router.post("/violation/:id", authenticateUser, voteViolation);

export default router;