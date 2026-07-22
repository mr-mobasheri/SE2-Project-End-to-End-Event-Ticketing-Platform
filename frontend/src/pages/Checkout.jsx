import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkout, pollTicket } from '../api/client';

function CountdownTimer({ lockedAt, expiresInSeconds }) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - lockedAt) / 1000);
    return Math.max(0, expiresInSeconds - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lockedAt) / 1000);
      setRemaining(Math.max(0, expiresInSeconds - elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedAt, expiresInSeconds]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  if (remaining <= 0) {
    return <div className="timer" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)' }}>⏰ Reservation expired</div>;
  }

  return (
    <div className="timer">
      ⏰ Seat held for {mins}:{secs.toString().padStart(2, '0')}
    </div>
  );
}

export default function Checkout() {
  const { token, username, selectedEvent, selectedSeat, reservation, setPayment, setTicket } = useAuth();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedSeat || !reservation) {
      navigate('/');
    }
  }, [selectedSeat, reservation, navigate]);

  if (!selectedSeat || !reservation) return null;

  const amount = selectedSeat.price;

  const handlePay = async () => {
    setPaying(true);
    setError('');

    const reservationId = `res_${Date.now()}`;

    const { ok, data } = await checkout(token, {
      user_id: username,
      seat_id: selectedSeat.seat_id,
      reservation_id: reservationId,
      amount
    });

    if (!ok) {
      setError(data.error || 'Payment failed. Please try again.');
      setPaying(false);
      return;
    }

    setPayment(data);

    const ticketResult = await pollTicket(data.reference_id);

    if (ticketResult.ok) {
      setTicket(ticketResult.data);
      navigate('/ticket');
    } else {
      setError(ticketResult.data.error || 'Payment succeeded but ticket generation failed.');
    }

    setPaying(false);
  };

  return (
    <div>
      <h1 className="card-title">Checkout</h1>
      <p className="card-subtitle">Review your order and complete payment</p>

      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <CountdownTimer lockedAt={reservation.locked_at} expiresInSeconds={reservation.expires_in_seconds} />

        <div className="checkout-summary">
          <div className="summary-row">
            <span className="summary-label">Event</span>
            <span>{selectedEvent?.title || 'Event'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Seat</span>
            <span>{selectedSeat.seat_id} ({selectedSeat.sector})</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Guest</span>
            <span>{username}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${amount.toFixed(2)}</span>
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => navigate(-1)} disabled={paying}>
            ← Back
          </button>
          <button className="btn btn-primary" onClick={handlePay} disabled={paying}>
            {paying ? <><span className="spinner" /> Processing...</> : `Pay $${amount.toFixed(2)} →`}
          </button>
        </div>
      </div>
    </div>
  );
}
