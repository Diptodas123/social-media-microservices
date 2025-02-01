import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

export const validateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        logger.warn("Access Denied: No token provided");
        return res.status(401).json({
            message: "Authentication required",
            success: false
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.error(`Invalid token: ${err.message}`);
            return res.status(429).json({
                message: "Invalid token",
                success: false
            });
        }
        req.user = user;
        next();
    });
}