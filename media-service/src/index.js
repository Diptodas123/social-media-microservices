import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { logger } from "./utils/logger.js";
import helmet from "helmet";
import mediaRoutes from "./routes/media-service.js";
import errorHandler from "./middlewares/errorHandler.js";
import { connectDB, rateLimiter, redisClient } from "./db.js";
import { sensitiveEndpointsLimiter } from "./middlewares/sensitiveEndpointsLimiter.js";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
import { handlePostDeleted } from "./eventHandlers/media-event-handlers.js";

config();

const app = express();
const PORT = process.env.PORT || 3003;

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
app.use("/api/media/upload", sensitiveEndpointsLimiter);

//Routes
app.use("/api/media", mediaRoutes);

//error handler
app.use(errorHandler);

async function startServer() {
    try {
        await connectToRabbitMQ();

        //consume all events
        await consumeEvent("post.deleted", handlePostDeleted);
        app.listen(PORT, () => {
            logger.info(`Media Service is running at ${PORT}`)
            console.log(`Media Service is running at http://localhost:${PORT}`);
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