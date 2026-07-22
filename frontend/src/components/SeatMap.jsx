import { useMemo } from 'react';

export default function SeatMap({ seats, selectedSeatId, onSelect, lockedSeats = [] }) {
  const sectors = useMemo(() => {
    const grouped = {};
    for (const seat of seats) {
      if (!grouped[seat.sector]) {
        grouped[seat.sector] = { name: seat.sector, price: seat.price, seats: [] };
      }
      grouped[seat.sector].seats.push(seat);
    }
    return Object.values(grouped);
  }, [seats]);

  const getGridCols = (sectorSeats) => {
    const maxCol = Math.max(...sectorSeats.map(s => s.col));
    return maxCol;
  };

  return (
    <div className="seat-map-container">
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'rgba(16, 185, 129, 0.3)', border: '1px solid rgba(16, 185, 129, 0.5)' }} />
          Available
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--accent)' }} />
          Selected
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.5)' }} />
          Locked
        </div>
      </div>

      <div className="stage">🎤 Stage</div>

      {sectors.map((sector) => {
        const cols = getGridCols(sector.seats);
        return (
          <div key={sector.name} className="sector-block">
            <div className="sector-header">
              <span className="sector-name">{sector.name}</span>
              <span className="sector-price">${sector.price}</span>
            </div>
            <div className="seat-grid" style={{ gridTemplateColumns: `repeat(${cols}, 36px)` }}>
              {sector.seats.map((seat) => {
                const isSelected = selectedSeatId === seat.seat_id;
                const isLocked = lockedSeats.includes(seat.seat_id);
                return (
                  <button
                    key={seat.seat_id}
                    className={`seat-btn ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                    onClick={() => !isLocked && onSelect(seat)}
                    disabled={isLocked}
                    title={`${seat.seat_id} — $${seat.price}`}
                  >
                    {seat.col}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
