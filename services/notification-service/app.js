// services/notification-service/app.js
const express = require('express');
const { Kafka } = require('kafkajs');
const crypto = require('crypto');

const app = express();
app.use(express.json({ type: '*/*' }));
app.use(express.urlencoded({ extended: true }));

// حافظه موقت برای بلیت‌ها
const ticketsMap = new Map();

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

            // Generate Cryptographic QR Hash
            const qrHash = crypto.createHash('sha256')
                .update(`${eventData.user_id}_${eventData.seat_id}_${eventData.reference_id}`)
                .digest('hex');

            // ساخت آدرس مستقیم عکس QR Code به صورت پویا جهت رندر در مرورگر
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrHash}`;

            // تعریف غنی فیلدها و تصاویر بلیت برای هماهنگی با هر نوع ساختار فرانت‌آند
            const ticket = {
                id: `tkt_${Math.floor(Math.random() * 1000000)}`,
                ticketId: `tkt_${Math.floor(Math.random() * 1000000)}`,
                userId: eventData.user_id,
                seatId: eventData.seat_id,
                referenceId: eventData.reference_id,
                reference_id: eventData.reference_id,
                reference: eventData.reference_id, 
                qrHash: qrHash,
                qrCodeHash: qrHash, 
                qrCodeUrl: qrCodeUrl,  // آدرس مستقیم تصویر
                qrCode: qrCodeUrl,     // آدرس مستقیم تصویر برای هماهنگی بیشتر
                qr_code: qrCodeUrl,    // آدرس مستقیم تصویر
                status: 'ACTIVE',
                createdAt: new Date().toISOString()
            };

            ticketsMap.set(eventData.reference_id, ticket);
            console.log(`[Notification] Ticket saved to memory for Ref ID: ${eventData.reference_id}`);
        }
    });
};

runConsumer().catch(console.error);

app.get('/api/v1/tickets/:referenceId', (req, res) => {
    const { referenceId } = req.params;
    console.log(`[Notification] Fetching ticket for Ref ID: ${referenceId}`);
    const ticket = ticketsMap.get(referenceId);
    if (ticket) {
        return res.status(200).json(ticket);
    } else {
        return res.status(404).json({ error: 'Ticket not found yet' });
    }
});

app.get('/health', (req, res) => res.status(200).send('Notification service consumer is running'));

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Notification Service listening on port 3005`));