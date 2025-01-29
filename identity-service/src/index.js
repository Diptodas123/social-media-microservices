import express from "express";
import { config } from "dotenv";
import { connectDB } from "./db.js";
import helmet from "helmet";
import cors from "cors";
import { logger } from "./utils/logger.js";
import { rateLimiter } from "./db.js";
import routes from "./routes/identity-service.js";
import errorHandler from "./middleware/errorHandler.js";
import { sensitiveEndpointsLimiter } from "./middleware/sensitiveEndpointsLimter.js";

//Load environment variables
config();

//initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

//Connect to database
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
app.use("/api/auth/register", sensitiveEndpointsLimiter);

//Routes
app.use("/api/auth", routes);

//error handler
app.use(errorHandler);

//Start the server
app.listen(PORT, () => {
    logger.info(`Identity Service is running at ${PORT}`)
    console.log(`Identity Service is running at http://localhost:${PORT}`);
})

//unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
})