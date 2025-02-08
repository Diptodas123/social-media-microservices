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

export async function publishEvent(routingKey, message) {
    if (!channel) {
        await connectToRabbitMQ();
    }

    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
    logger.info(`Event Published: ${routingKey}`)
}

export async function consumeEvent(routingKey, callback) {
    if (!channel) {
        await connectToRabbitMQ();
    }

    const q = await channel.assertQueue("", { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
    channel.consume(q.queue, (msg => {
        if (msg !== null) {
            const content = JSON.parse(msg.content.toString());
            callback(content);
            channel.ack(msg);
        }
    }));

    logger.info(`Subscribed to event: ${routingKey}`);
}