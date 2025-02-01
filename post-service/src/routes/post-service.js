import { Router } from "express";
import { createPost, getAllPosts, getPost, deletePost } from "../controllers/post-controller.js";
import { authenticateRequest } from "../middlewares/authMiddleware.js";
const router = Router();

router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/get-all-posts", getAllPosts);
router.get("/get-post/:postId", getPost);
router.delete("/delete-post/:postId", deletePost);

export default router;