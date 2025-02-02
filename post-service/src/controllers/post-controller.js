import { logger } from "../utils/logger.js";
import Post from "../models/Post.js";
import { validateCreatePost } from "../utils/validation.js";

async function invalidatePostCache(req, input) {

    //invalidate the cache for a single post
    const postId=`post:${input}`;
    await req.redisClient.del(postId);

    //invalidate the cache for all posts
    const keys = await req.redisClient.keys('posts:*');
    if (keys.length > 0) {
        await req.redisClient.del(keys);
    }
}

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

        //invalidate the cache, otherwise the new post will not be visible in the list
        await invalidatePostCache(req, newPost._id.toString());

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts) {
            return res.status(200).json({
                success: true,
                message: "Posts fetched successfully",
                data: JSON.parse(cachedPosts)
            });
        }

        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        if (!posts) {
            return res.status(404).json({
                success: false,
                message: "No posts found"
            });
        }

        const totalNoOfPosts = await Post.countDocuments();

        const result = {
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalNoOfPosts / limit),
            totalPosts: totalNoOfPosts
        };

        //cache the result for 5 minutes
        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

        return res.status(200).json({
            success: true,
            message: "Posts fetched successfully",
            data: result
        });
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
        const postId = req.params.postId;
        const cacheKey = `post:${postId}`;
        const cachedPost = await req.redisClient.get(cacheKey);

        if (cachedPost) {
            return res.status(200).json({
                success: true,
                message: "Post fetched successfully",
                data: JSON.parse(cachedPost)
            });
        }

        const singlePostById = await Post.findById(postId);

        if (!singlePostById) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        //cache the result for 1 hour
        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePostById));

        return res.status(200).json({
            success: true,
            message: "Post fetched successfully",
            data: singlePostById
        });
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
        const postId = req.params.postId;
        const deletedPost = await Post.findByIdAndDelete({
            _id: postId,
            user: req.user.userId
        });

        if (!deletedPost) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        //invalidate the cache
        await invalidatePostCache(req, postId);

        return res.status(200).json({
            success: true,
            message: "Post deleted successfully"
        });
    } catch (error) {
        logger.error("Error occurred while deleting a post", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}