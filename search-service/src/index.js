import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { logger } from "./utils/logger.js";
import helmet from "helmet";
import searchRoutes from "./routes/search-service.js";
import errorHandler from "./middlewares/errorHandler.js";
import { connectDB, rateLimiter, redisClient } from "./db.js";
import { sensitiveEndpointsLimiter } from "./middlewares/sensitiveEndpointsLimiter.js";
import { connectToRabbitMQ } from "./utils/rabbitmq.js";
import { consumeEvent } from "./utils/rabbitmq.js";
import { handlePostCreated, handlePostDeleted } from "./eventHandlers/search-event-handlers.js";

config();

const app = express();
const PORT = process.env.PORT || 3004;

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
app.use("/api/search/posts", sensitiveEndpointsLimiter);

//Routes
app.use("/api/search", searchRoutes);

//error handler
app.use(errorHandler);

//Start the server
async function startServer() {
    try {
        await connectToRabbitMQ();

        //consume post.created whenver a post has been created in the Post DB
        await consumeEvent("post.created", handlePostCreated);

        //consume post.deleted whenver a post has been deleted in the Post DB
        await consumeEvent("post.deleted", handlePostDeleted);

        app.listen(PORT, () => {
            logger.info(`Search Service is running at ${PORT}`)
            console.log(`Search Service is running at http://localhost:${PORT}`);
        })
    } catch (error) {
        logger.error("Failed to connect to Server", error);
        process.exit(1);
    }
}

startServer();

//unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
})