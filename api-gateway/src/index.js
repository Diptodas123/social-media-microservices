import { config } from "dotenv";
import express from "express";
import cors from "cors";
import errorHandler from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";
import { Redis } from "ioredis";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import proxy from "express-http-proxy";

config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Redis client
const redisClient = new Redis(process.env.REDIS_URL);

// Middleware 
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use((req, res, next) => {
    logger.info(`${req.method} - ${req.originalUrl} - ${req.ip}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});

// Rate limiter setup
const rateLimitOptions = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});
app.use(rateLimitOptions);

// Proxy setup
const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api");
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error: ${err.message}`, { stack: err.stack });
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    },
};

// Setting up proxy for identity service
app.use("/v1/auth", proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqBodyDecorator: (bodyContent, req) => {
        req.headers["Content-Type"] = "application/json";
        return JSON.stringify(bodyContent);
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response from identity service: ${proxyRes.statusCode}`);
        return proxyResData;
    },
}));

// Global error handler
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
    logger.info(`API gateway is running on port ${PORT}`);
    logger.info(`Identity service is running at ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Redis is running at ${process.env.REDIS_URL}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});

process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
});
