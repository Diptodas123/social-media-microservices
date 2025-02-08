import Media from "../models/Media.js";
import { logger } from "../utils/logger.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";

const handlePostDeleted = async (event) => {
    try {
        const { postId, mediaIds } = event;
        const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });

        for (const media of mediaToDelete) {
            await deleteMediaFromCloudinary(media.publicId);
            await Media.findByIdAndDelete(media._id)
            logger.info(`Deleted media: ${media._id} associated with the post: ${postId}`);
        }

        logger.info(`Processed deletion of media for the postId: ${postId}`);
    } catch (error) {
        logger.error("Error occured while Media deletion", error);
    }
}

export { handlePostDeleted }