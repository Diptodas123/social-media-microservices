import Media from "../models/Media.js";
import { uploadMediaToCloudinary } from "../utils/cloudinary.js";
import { logger } from "../utils/logger.js";

export const uploadMedia = async (req, res) => {
    logger.info("Starting media upload");

    try {
        if (!req.file) {
            logger.error(`No file found, Please add a file and try again!`);
            return res.status(400).json({
                success: false,
                message: "No file found, Please add a file and try again!"
            });
        }

        const { originalName, mimeType, buffer } = req.file;
        const userId = req.user.userId;

        logger.info(`File details: name=${originalName}, type=${mimeType}`);
        logger.info(`Uploading to cloudinary...`);

        const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
        logger.info(`File uploaded to Cloudinary having, Public Id- ${cloudinaryUploadResult.public_id}`);

        const newlyCreatedMedia = new Media({
            publicId: cloudinaryUploadResult.public_id,
            originalName,
            mimeType,
            url: cloudinaryUploadResult.secure_url,
            userId
        });

        await newlyCreatedMedia.save();

        return res.status(201).json({
            success: false,
            message: "Media uploaded successfully",
            mediaId: newlyCreatedMedia._id,
            url: newlyCreatedMedia.url
        })
    } catch (error) {
        logger.error("IError while uploading file to Cloudinary", error);
        return res.status(500).status({
            success: false,
            message: "Error while uploading file to Cloudinary"
        })
    }
}