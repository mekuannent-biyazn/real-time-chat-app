import express from "express";
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  deleteMessage,
  addReaction,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.delete("/:id", protectRoute, deleteMessage);
router.post("/:id/reaction", protectRoute, addReaction);

export default router;
