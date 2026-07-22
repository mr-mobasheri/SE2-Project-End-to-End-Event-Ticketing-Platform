import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ticketsaz_token') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('ticketsaz_user') || '');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [payment, setPayment] = useState(null);
  const [ticket, setTicket] = useState(null);

  const login = useCallback((newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
    localStorage.setItem('ticketsaz_token', newToken);
    localStorage.setItem('ticketsaz_user', newUsername);
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setUsername('');
    setSelectedEvent(null);
    setSelectedSeat(null);
    setReservation(null);
    setPayment(null);
    setTicket(null);
    localStorage.removeItem('ticketsaz_token');
    localStorage.removeItem('ticketsaz_user');
  }, []);

  const resetBooking = useCallback(() => {
    setSelectedEvent(null);
    setSelectedSeat(null);
    setReservation(null);
    setPayment(null);
    setTicket(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      token, username, selectedEvent, selectedSeat, reservation, payment, ticket,
      login, logout, resetBooking,
      setSelectedEvent, setSelectedSeat, setReservation, setPayment, setTicket,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
