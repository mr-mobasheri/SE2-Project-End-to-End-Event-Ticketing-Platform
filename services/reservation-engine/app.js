// services/reservation-engine/app.js
const express = require('express');
const { createClient } = require('redis');
const { Kafka } = require('kafkajs');
const { Pool } = require('pg');
const crypto = require('crypto');

const app = express();
app.use(express.json({ type: '*/*' }));
app.use(express.urlencoded({ extended: true }));

// PostgreSQL Connection Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres_admin:TicketingSecurePass123@ticketing-postgres:5432/ticketing'
});

// Redis Connection
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect().then(() => console.log('Successfully connected to Redis'));

// Kafka Setup
const kafka = new Kafka({
    clientId: 'reservation-engine',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const producer = kafka.producer();
producer.connect().then(() => console.log('Kafka Producer Connected'));

// Kafka Consumer: به محض پرداخت موفق وضعیت صندلی در PostgreSQL آپدیت می‌شود
const consumer = kafka.consumer({ groupId: 'reservation-group' });
const runConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: 'ticketing-payments', fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const eventData = JSON.parse(message.value.toString());
            try {
                // آپدیت وضعیت صندلی خریداری‌شده به CONFIRMED
                await pool.query(
                    "UPDATE reservations SET status = 'CONFIRMED' WHERE seat_id = $1",
                    [eventData.seat_id]
                );
                console.log(`[Reservation Engine] PostgreSQL Reservation status updated to CONFIRMED for Seat: ${eventData.seat_id}`);
            } catch (err) {
                console.error('[Reservation Engine] Failed to update PostgreSQL status:', err.message);
            }
        }
    });
};
runConsumer().catch(console.error);

// API Endpoint: Lock Seat
app.post('/api/v1/reservations/lock', async (req, res) => {
    const seat_id = req.body.seat_id || req.body.seatId;
    const user_id = req.body.user_id || req.body.userId || req.body.username || req.body.user;
    const event_id = req.body.event_id || req.body.eventId;

    if (!seat_id || !user_id) {
        return res.status(400).json({ error: 'seat_id and user_id are required' });
    }

    try {
        const lockKey = `lock:seat:${seat_id}`;
        const lockAcquired = await redisClient.set(lockKey, user_id, { NX: true, EX: 600 });

        if (lockAcquired) {
            // ایجاد رکورد موقت رزرواسیون در دیتابیس با شناسه UUID استاندارد
            try {
                const dbReservationId = crypto.randomUUID(); // تولید UUID استاندارد به صورت بومی
                const expiresAt = new Date(Date.now() + 600000);
                await pool.query(
                    "INSERT INTO reservations (id, seat_id, user_id, status, expires_at) VALUES ($1, $2, $3, 'PENDING', $4)",
                    [dbReservationId, seat_id, user_id, expiresAt]
                );
            } catch (dbErr) {
                console.error("[Reservation Engine] DB Insert pending reservation failed:", dbErr.message);
            }

            await producer.send({
                topic: 'ticketing-reservations',
                messages: [{ value: JSON.stringify({ event_id, seat_id, user_id, status: 'LOCKED', expires_at: Date.now() + 600000 }) }]
            });

            return res.status(200).json({ message: 'Temporary lock acquired successfully', seat_id, expires_in_seconds: 600 });
        } else {
            return res.status(409).json({ error: 'Seat is currently locked', seat_id });
        }
    } catch (error) {
        console.error('Error locking seat:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Reservation Engine listening on port ${PORT}`));