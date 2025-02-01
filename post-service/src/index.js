import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { logger } from "./utils/logger.js";
import helmet from "helmet";
import postRoutes from "./routes/post-service.js";
import errorHandler from "./middlewares/errorHandler.js";
import { connectDB, rateLimiter, redisClient } from "./db.js";
import { sensitiveEndpointsLimiter } from "./middlewares/sensitiveEndpointsLimiter.js";

config();

const app = express();
const PORT = process.env.PORT || 3002;

connectDB();

//middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use((req, res, next) => {
    logger.info(`${req.method} - ${req.originalUrl} - ${req.ip}`);
    logger.info(`Request body: ${JSON.stringify(req.body && req.body.password ? { ...req.body, password: "*******" } : req.body)}`);    //Masking password
    next();
});
//Rate limiter middleware
app.use((req, res, next) => {
    rateLimiter.consume(req.ip)
        .then(() => next())
        .catch(() => {
            logger.warn(`Rate limit exceeded for ${req.ip}`);
            res.status(429).json({ success: false, message: "Too many requests" })
        });
});

//IP based rate limiting middleware for sensitive endpoints
app.use("/api/posts/create-post", sensitiveEndpointsLimiter);

//Routes
app.use("/api/posts", (req, res, next) => {
    req.redisClient = redisClient;  //inject redisClient to request object for caching
    next();
}, postRoutes);

//error handler
app.use(errorHandler);

//Start the server
app.listen(PORT, () => {
    logger.info(`Post Service is running at ${PORT}`)
    console.log(`Post Service is running at http://localhost:${PORT}`);
})

//unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
})