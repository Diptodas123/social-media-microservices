import { logger } from "../utils/logger.js";
import { validateLogin, validateRegistration } from "../utils/validation.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import RefreshToken from "../models/RefreshToken.js";

export const registerUser = async (req, res) => {
    logger.info("Registration endpoint called");

    try {
        //validate the schema
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { username, email, password } = req.body;

        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
            logger.warn("User already exists");
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        user = new User({ username, email, password });
        await user.save();
        logger.warn("User saved successfully", user._id);

        const { accessToken, refreshToken } = await generateToken(user);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            accessToken,
            refreshToken
        });

    } catch (error) {
        logger.error("Error occurred while registering user", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const loginUser = async (req, res) => {
    logger.info("Login endpoint called");

    try {

        const { error } = validateLogin(req.body);

        if (error) {
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            logger.warn("User not found");
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isValidPassowrd = await user.comparePassword(password);

        if (!isValidPassowrd) {
            logger.warn("Invalid password");
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const { accessToken, refreshToken } = await generateToken(user);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            accessToken,
            refreshToken,
            userId: user._id
        });

    } catch (error) {
        logger.error("Error occurred while logging in user", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const refreshTokenUser = async (req, res) => {
    logger.info("Refresh token endpoint called");

    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            logger.warn("Refresh token not provied");
            return res.status(400).json({
                success: false,
                message: "Refresh token not provided"
            });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });

        if (!storedToken || storedToken.expiresAt < new Date()) {
            logger.warn("Invalid or expired refresh token");
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token"
            });
        }

        const user = await User.findById(storedToken.user);

        if (!user) {
            logger.warn("User not found");
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateToken(user);

        //delete the old refresh token
        await RefreshToken.deleteOne({ _id: storedToken._id });

        return res.json({
            success: true,
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });

    } catch (error) {
        logger.error("Error occurred while refreshing token", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const logoutUser = async (req, res) => {
    logger.info("Logout endpoint called");

    try {
        const {refreshToken}=req.body;

        if (!refreshToken) {
            logger.warn("Refresh token not provied");
            return res.status(400).json({
                success: false,
                message: "Refresh token not provided"
            });
        }

        const storedToken=await RefreshToken.findOne({token:refreshToken});

        await RefreshToken.deleteOne({_id:storedToken._id});
        logger.info("Refresh token deleted for logout");
        
        return res.json({
            success:true,
            message:"User logged out successfully"
        });
        
    } catch (error) {
        logger.error("Error occurred while logging out user", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}
