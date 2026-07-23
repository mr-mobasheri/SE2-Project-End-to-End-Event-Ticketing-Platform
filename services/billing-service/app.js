// services/billing-service/app.js
const express = require('express');
const { Kafka } = require('kafkajs');

const app = express();

// بادی‌پارسرهای ضدگلوله برای پذیرش تمامی فرمت‌های فرانت‌آند
app.use(express.json({ type: '*/*' })); // فیلتر کردن و پارس اجباری هر نوع هدر ورودی به فرمت JSON
app.use(express.urlencoded({ extended: true })); // پشتیبانی کامل از داده‌های فرمی و URL-Encoded

// Kafka Setup
const kafka = new Kafka({
    clientId: 'billing-service',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const producer = kafka.producer();
producer.connect().then(() => console.log('Billing Kafka Producer Connected'));

// API Endpoint: Checkout & Process Payment
app.post('/api/v1/payments/checkout', async (req, res) => {
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);

    // پذیرش هم‌زمان camelCase (فرانت‌آند) و snake_case (مستند پروژه) برای جلوگیری از تعارض
    const user_id = req.body.user_id || req.body.userId || req.body.username || req.body.user;
    const seat_id = req.body.seat_id || req.body.seatId;
    const amount = req.body.amount || req.body.price;
    const reservation_id = req.body.reservation_id || req.body.reservationId || req.body.bookingId || req.body.id;

    // اعتبارسنجی منعطف ورودی‌ها
    if (!user_id || !seat_id || !reservation_id) {
        console.warn(`[Billing] Validation Failed: user_id=${user_id}, seat_id=${seat_id}, reservation_id=${reservation_id}`);
        return res.status(400).json({ error: 'Missing payment details' });
    }

    try {
        console.log(`[Billing] Simulating bank gateway transaction for User: ${user_id}, Amount: ${amount}`);
        
        // Simulate gateway latency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const referenceId = `ref_bank_${Math.floor(Math.random() * 10000000)}`;
        console.log(`[Billing] Payment successful. Ref ID: ${referenceId}`);

        // Publish OrderPaidEvent (Published Language - PL) to Kafka using resolved variables
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
app.listen(PORT, () => console.log("Billing Service listening on port 3004"));