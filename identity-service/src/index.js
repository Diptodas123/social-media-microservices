import express from "express";
import { config } from "dotenv";
import connectDB from "./db.js";
import helmet from "helmet";
import cors from "cors";
import logger from "./utils/logger.js";

//Load environment variables
config();

//initialize express app
const app = express();

//middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use((req, res, next) => {
    logger.info(`${req.method} - ${req.originalUrl} - ${req.ip}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});

//Connect to database
connectDB();

//Routes
app.get("/", (req, res) => {
    return res.send("Identity service is up and running")
});

//Start the server
app.listen(process.env.PORT, () => {
    console.log(`Identity Service is running at http://localhost:${process.env.PORT}`);
})
