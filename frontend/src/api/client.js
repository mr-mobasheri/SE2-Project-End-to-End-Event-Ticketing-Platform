const API_BASE = '/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

export async function login(username) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username })
  });
}

export async function getEvents() {
  return request('/events');
}

export async function getEventSeats(eventId) {
  return request(`/events/${eventId}/seats`);
}

export async function lockSeat(token, { seat_id, user_id, event_id }) {
  return request('/reservations/lock', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ seat_id, user_id, event_id })
  });
}

export async function checkout(token, payload) {
  return request('/payments/checkout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
}

export async function getTicket(referenceId) {
  return request(`/tickets/${referenceId}`);
}

export async function pollTicket(referenceId, maxAttempts = 15, intervalMs = 800) {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getTicket(referenceId);
    if (result.ok) return result;
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return { ok: false, data: { error: 'Ticket generation timed out. Please try again.' } };
}
