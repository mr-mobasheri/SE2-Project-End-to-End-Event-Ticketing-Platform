// notification-service/app.js
const express = require('express');
const { Kafka } = require('kafkajs');
const crypto = require('crypto');
const QRCode = require('qrcode');

const app = express();

const tickets = new Map();

function generateQrHash(userId, seatId, referenceId) {
    return crypto.createHash('sha256')
        .update(`${userId}_${seatId}_${referenceId}`)
        .digest('hex');
}

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
        eachMessage: async ({ message }) => {
            const eventData = JSON.parse(message.value.toString());
            console.log(`[Notification] Received OrderPaidEvent from Kafka for Seat: ${eventData.seat_id}`);

            const qrHash = generateQrHash(eventData.user_id, eventData.seat_id, eventData.reference_id);
            console.log(`[Notification] Cryptographic QR Hash generated: ${qrHash}`);

            tickets.set(eventData.reference_id, {
                user_id: eventData.user_id,
                seat_id: eventData.seat_id,
                reference_id: eventData.reference_id,
                reservation_id: eventData.reservation_id,
                amount: eventData.amount,
                qr_hash: qrHash,
                issued_at: new Date().toISOString()
            });

            console.log(`[Notification] Dispatching Ticket Email/SMS to User ${eventData.user_id}...`);
            await new Promise(resolve => setTimeout(resolve, 300));
            console.log(`[Notification] Ticket delivered successfully to User ${eventData.user_id}!`);
        }
    });
};

runConsumer().catch(console.error);

app.get('/health', (req, res) => res.status(200).send('Notification service consumer is running'));

app.get('/api/v1/tickets/:referenceId', async (req, res) => {
    const ticket = tickets.get(req.params.referenceId);

    if (!ticket) {
        return res.status(404).json({ error: 'Ticket not ready yet. Please wait a moment and try again.' });
    }

    try {
        const qrCode = await QRCode.toDataURL(ticket.qr_hash, {
            width: 280,
            margin: 2,
            color: { dark: '#1a1a2e', light: '#ffffff' }
        });

        return res.status(200).json({ ...ticket, qr_code: qrCode });
    } catch (error) {
        console.error('QR generation failed:', error);
        return res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Notification Service listening on port ${PORT}`));
