import amqp from "amqplib";
import { logger } from "./logger.js";

let connection = null;
let channel = null;

const EXCHANGE_NAME = "media_events";

export async function connectToRabbitMQ() {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
        logger.info("Connected to RaabitMQ");

        return channel;
    } catch (error) {
        logger.error("Error connecting with RabbitMQ", error)
    }
}

export async function publishEvent(routingKey,message){
    if(!channel){
        await connectToRabbitMQ();
    }

    channel.publish(EXCHANGE_NAME,routingKey,Buffer.from(JSON.stringify(message)));
    logger.info(`Event Published: ${routingKey}`)
}