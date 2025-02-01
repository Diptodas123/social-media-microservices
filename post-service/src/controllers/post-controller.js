import { logger } from "../utils/logger.js";
import Post from "../models/Post.js";
import { validateCreatePost } from "../utils/validation.js";

export const createPost = async (req, res) => {
    logger.info("create Post enpoint called");

    try {
        //validate the schema
        const { error } = validateCreatePost(req.body);
        if (error) {
            logger.error("Validation error occurred while creating post", error);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { content, mediaIds } = req.body;
        const newPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        });
        await newPost.save();
        logger.info("Post created successfully");

        return res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: newPost
        });

    } catch (error) {
        logger.error("Error occurred while creating post", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const getAllPosts = async (req, res) => {
    logger.info("Get all posts endpoint called");

    try {

    } catch (error) {
        logger.error("Error occurred while fetching all posts", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const getPost = async (req, res) => {
    logger.info("Get post endpoint called");

    try {

    } catch (error) {
        logger.error("Error occurred while fetching a single post", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const deletePost = async (req, res) => {
    logger.info("Delete post endpoint called");

    try {

    } catch (error) {
        logger.error("Error occurred while deleting a post", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}