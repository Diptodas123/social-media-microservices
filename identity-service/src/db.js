import { connect } from "mongoose";
import  {logger}  from "./utils/logger.js";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

const connectDB = async () => {
    try {
        await connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.umacx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);
        logger.info("DB connected successfully");
    } catch (error) {
        logger.error("DB connction faild", error);
    }
}

const redisClient = new Redis(process.env.REDIS_URL);

//DDos Protection and Rate Limiting
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1
})

export { connectDB, redisClient, rateLimiter };