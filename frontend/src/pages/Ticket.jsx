import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Ticket() {
  const { ticket, selectedEvent, selectedSeat, username, resetBooking } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!ticket) {
      navigate('/');
    }
  }, [ticket, navigate]);

  if (!ticket) return null;

  const handleNewBooking = () => {
    resetBooking();
    navigate('/');
  };

  return (
    <div>
      <div className="card ticket-card">
        <div className="ticket-success-icon">✓</div>
        <h1 className="card-title">You're All Set!</h1>
        <p className="card-subtitle">Your digital ticket is ready. Show this QR code at the venue.</p>

        {ticket.qr_code && (
          <div className="qr-wrapper">
            <img src={ticket.qr_code} alt="Ticket QR Code" />
          </div>
        )}

        <div className="ticket-details">
          <div className="ticket-detail-row">
            <span>Event</span>
            <span>{selectedEvent?.title || 'Event'}</span>
          </div>
          <div className="ticket-detail-row">
            <span>Seat</span>
            <span>{selectedSeat?.seat_id || ticket.seat_id}</span>
          </div>
          <div className="ticket-detail-row">
            <span>Guest</span>
            <span>{username}</span>
          </div>
          <div className="ticket-detail-row">
            <span>Reference</span>
            <span>{ticket.reference_id}</span>
          </div>
          <div className="ticket-detail-row">
            <span>Amount Paid</span>
            <span>${Number(ticket.amount || selectedSeat?.price || 0).toFixed(2)}</span>
          </div>
          {ticket.qr_hash && (
            <div className="ticket-hash">
              Secure hash: {ticket.qr_hash}
            </div>
          )}
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleNewBooking} style={{ marginTop: '1.5rem' }}>
          Book Another Event
        </button>
      </div>
    </div>
  );
}
