import { createLogger, format, transports } from "winston";

export const logger = createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
    ),
    defaultMeta: { service: "media-service" },
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple(),
            ),
        }),
        new transports.File({ filename: "error.log", level: "error" }),
        new transports.File({ filename: "combined.log" })
    ]
}); 