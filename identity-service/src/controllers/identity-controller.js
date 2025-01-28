import {logger} from "../utils/logger.js";
import { validateRegistration } from "../utils/validation.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

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

