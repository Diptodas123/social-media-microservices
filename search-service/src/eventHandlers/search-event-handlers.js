import {Types} from "mongoose";
import Search from "../models/Search.js";
import { logger } from "../utils/logger.js";

export const handlePostCreated = async (event) => {
    try {
        const { postId, userId, content, createdAt } = event;

        const newSearchPost = await Search({
            postId,
            userId,
            content,
            createdAt
        });
        await newSearchPost.save();

        logger.info(`Search Post created: ${newSearchPost._id.toString()} associated with post: ${postId},`);
    } catch (error) {
        logger.error("Error occured while handling post craetion event", error);
    }
}

export const handlePostDeleted = async (event) => {
    try {
        const { postId, userId } = event;

        const deletedSearchPost=await Search.findOneAndDelete({postId});
        logger.info(`Deleted searchPost: ${deletedSearchPost._id} associated with the post: ${postId}`);
    } catch (error) {
        logger.error("Error occured while handling post deletion event", error);
    }
}