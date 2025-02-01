import { Router } from "express";
import { loginUser, logoutUser, refreshTokenUser, registerUser } from "../controllers/identity-controller.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token",refreshTokenUser);
router.post("/logout",logoutUser);

export default router;