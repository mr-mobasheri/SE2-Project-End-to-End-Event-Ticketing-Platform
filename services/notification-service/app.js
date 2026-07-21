// notification-service/app.js
const express = require('express');
const { Kafka } = require('kafkajs');
const crypto = require('crypto');

const app = express();

// Kafka Setup
const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const consumer = kafka.consumer({ groupId: 'notification-group' });

const runConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'ticketing-payments', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const eventData = JSON.parse(message.value.toString());
            console.log(`[Notification] Received OrderPaidEvent from Kafka for Seat: ${eventData.seat_id}`);

            // 1. Generate Unique Cryptographic Hash for QR Code
            const qrHash = crypto.createHash('sha256')
                .update(`${eventData.user_id}_${eventData.seat_id}_${eventData.reference_id}`)
                .digest('hex');

            console.log(`[Notification] Cryptographic QR Hash generated: ${qrHash}`);

            // 2. Simulate sending asynchronous SMS & Email (Non-blocking)
            console.log(`[Notification] Dispatching Ticket Email/SMS to User ${eventData.user_id}...`);
            await new Promise(resolve => setTimeout(resolve, 300)); // simulate dispatch
            console.log(`[Notification] Ticket delivered successfully to User ${eventData.user_id}!`);
        }
    });
};

runConsumer().catch(console.error);

app.get('/health', (req, res) => res.status(200).send('Notification service consumer is running'));

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Notification Service listening on port ${PORT}`));