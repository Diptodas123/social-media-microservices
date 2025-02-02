import { Router } from "express";
import { createPost, getAllPosts, getPost, deletePost } from "../controllers/post-controller.js";
import { authenticateRequest } from "../middlewares/authMiddleware.js";
const router = Router();

router.use(authenticateRequest);

router.post("/create-post", createPost);
router.get("/all-posts", getAllPosts);
router.route("/:postId")
    .get(getPost)   
    .delete(deletePost);

export default router;