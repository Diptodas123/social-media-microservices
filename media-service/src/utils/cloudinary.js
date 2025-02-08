import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger.js";

cloudinary.config({
    cloud_name: "di0c1nqwn",
    api_key: "972125545339653",
    api_secret: "r1jdAqbs7XQ9b0uzjoRLs4MQn4A"
});

const uploadMediaToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            resource_type: "auto",
        }, (error, result) => {
            if (error) {
                logger.error(`Error while uploading media to cloudinary`, error);
                reject(error);
            } else {
                resolve(result);
            }
        });

        uploadStream.end(file.buffer);
    });
};

const deleteMediaFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        logger.info("Media deleted successfully from cloudinary", publicId);
        return result; 
    } catch (error) {
        logger.error("Error While deleting media from Cloudinary", error);
        throw error;
    }
}

export { uploadMediaToCloudinary, deleteMediaFromCloudinary };