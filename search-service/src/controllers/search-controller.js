import Search from "../models/Search.js";
import { logger } from "../utils/logger.js";

const searchPostController = async (req, res) => {
    logger.info("Search endpoint called...");

    try {
        const { query } = req.query;

        const results = await Search.find(
            { $text: { $search: query } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } }).limit(10);

        return res.status(200).json({
            success: true,
            data: results
        });

    } catch (error) {
        logger.error("Error while searching post", error);
        return res.status(500).json({
            success: false,
            message: "Error while searching post"
        });
    }
}

export { searchPostController };