import { Router } from "express";
import { registerUser } from "../controllers/identity-controller.js";

const router = Router();

router.post("/register",registerUser);

export default router;