import {Router} from "express";
import { authenticateRequest } from "../middlewares/authMiddleware.js";
import { searchPostController } from "../controllers/search-controller.js";

const router=Router();

router.use(authenticateRequest);

router.get("/posts",searchPostController);

export default router;