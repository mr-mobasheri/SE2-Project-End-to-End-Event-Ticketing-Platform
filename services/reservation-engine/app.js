// reservation-engine/app.js
const express = require('express');
const { createClient } = require('redis');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.json());

// 1. Redis Connection Configuration
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect().then(() => console.log('Successfully connected to Redis Sentinel/Cluster'));

// 2. Kafka Connection Configuration
const kafka = new Kafka({
    clientId: 'reservation-engine',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const producer = kafka.producer();
producer.connect().then(() => console.log('Kafka Producer Connected'));

// 3. API Endpoint: Lock Seat with 10 Minutes TTL
app.post('/api/v1/reservations/lock', async (req, res) => {
    const { seat_id, user_id, event_id } = req.body;

    if (!seat_id || !user_id) {
        return res.status(400).json({ error: 'seat_id and user_id are required' });
    }

    try {
        const lockKey = `lock:seat:${seat_id}`;
        
        // SET key value NX EX 600
        // NX: Only set if the key does not already exist
        // EX 600: Lock expires strictly after 10 minutes (600 seconds)
        const lockAcquired = await redisClient.set(lockKey, user_id, {
            NX: true,
            EX: 600
        });

        if (lockAcquired) {
            console.log(`[Reservation] Temporary lock acquired for Seat: ${seat_id} by User: ${user_id}`);
            
            // Publish "SeatLockedEvent" to Kafka
            await producer.send({
                topic: 'ticketing-reservations',
                messages: [{
                    value: JSON.stringify({ event_id, seat_id, user_id, status: 'LOCKED', expires_at: Date.now() + 600000 })
                }]
            });

            return res.status(200).json({
                message: 'Temporary lock acquired successfully',
                seat_id,
                expires_in_seconds: 600
            });
        } else {
            console.warn(`[Reservation] Concurrency Blocked: Seat ${seat_id} is already LOCKED`);
            return res.status(409).json({
                error: 'Seat is currently locked by another user (Double-Booking Prevented)',
                seat_id
            });
        }
    } catch (error) {
        console.error('Error locking seat:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Reservation Engine listening on port ${PORT}`));