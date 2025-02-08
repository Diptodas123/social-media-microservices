import { Router } from "express";
import multer from "multer";
import { getAllMedia, uploadMedia } from "../controllers/media-controller.js";
import { authenticateRequest } from "../middlewares/authMiddleware.js";
import { logger } from "../utils/logger.js";

const router = Router();

//configure multer to upload files
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
}).single('file');

router.post('/upload', authenticateRequest, (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            logger.error('Multer error while uploading', err);
            return res.status(400).json({
                success: false,
                error: err.message,
                stack: err.stack,
                message: "Multer error while uploading"
            });
        } else if (err) {
            logger.error('Unknown error occured while uploading', err);
            return res.status(500).json({
                success: false,
                error: err.message,
                stack: err.stack,
                message: "Unknown error occured while uploading"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file found"
            });
        }

        next();
    })
}, uploadMedia);

router.get("/get",authenticateRequest, getAllMedia);

export default router;