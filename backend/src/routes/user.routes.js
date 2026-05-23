import express from "express";
import { searchUsers, getUserById } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.get("/:id", protectRoute, getUserById);

export default router;
