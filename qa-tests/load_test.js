import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = { vus: 5000, duration: '10s' };
export default function () {
    const payload = JSON.stringify({ seat_id: 'a1b2c3d4-e5f6', user_id: `user_${__VU}` });
    const params = { headers: { 'Content-Type': 'application/json' } };
    const res = http.post('http://localhost:8080/api/v1/reservations/lock', payload, params);
    check(res, { 'Lock acquired (200)': (r) => r.status === 200, 'Seat locked (409)': (r) => r.status === 409 });
    sleep(1);
}