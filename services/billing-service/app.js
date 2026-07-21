// billing-service/app.js
const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.json());

// Kafka Setup
const kafka = new Kafka({
    clientId: 'billing-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const producer = kafka.producer();
producer.connect().then(() => console.log('Billing Kafka Producer Connected'));

// API Endpoint: Checkout & Process Payment
app.post('/api/v1/payments/checkout', async (req, res) => {
    const { user_id, seat_id, amount, reservation_id } = req.body;

    if (!user_id || !seat_id || !reservation_id) {
        return res.status(400).json({ error: 'Missing payment details' });
    }

    try {
        console.log(`[Billing] Simulating bank gateway transaction for User: ${user_id}, Amount: ${amount}`);
        
        // Simulate gateway latency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const referenceId = `ref_bank_${Math.floor(Math.random() * 10000000)}`;
        console.log(`[Billing] Payment successful. Ref ID: ${referenceId}`);

        // Publish OrderPaidEvent (Published Language - PL) to Kafka
        const eventPayload = {
            user_id,
            seat_id,
            reservation_id,
            amount,
            reference_id: referenceId,
            status: 'SUCCESS',
            timestamp: new Date().toISOString()
        };

        await producer.send({
            topic: 'ticketing-payments',
            messages: [{
                key: reservation_id,
                value: JSON.stringify(eventPayload)
            }]
        });

        console.log(`[Billing] OrderPaidEvent published to Kafka for Reservation: ${reservation_id}`);

        return res.status(200).json({
            message: 'Payment processed successfully',
            reference_id: referenceId,
            status: 'SUCCESS'
        });
    } catch (error) {
        console.error('Payment processing failed:', error);
        return res.status(500).json({ error: 'Payment failed' });
    }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Billing Service listening on port ${PORT}`));