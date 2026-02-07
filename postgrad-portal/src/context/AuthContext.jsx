// ============================================
// PostGrad Portal – Auth Context (Reactive)
// ============================================

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  mockUsers, getNotificationsForUser, subscribe,
  markNotificationsRead, markNotificationRead, addNotification,
} from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tick, setTick] = useState(0);           // force re-render on mock-data mutations

  /* Subscribe to mock-data changes */
  useEffect(() => {
    const unsub = subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const login = useCallback((email, _password) => {
    const found = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password' };
  }, []);

  const logout = useCallback(() => { setUser(null); setIsAuthenticated(false); }, []);

  /* Compute notifications from live store on every tick */
  const notifications = user ? getNotificationsForUser(user.id) : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  /* Mutation helpers exposed to consumers */
  const handleMarkAllRead = useCallback(() => { if (user) markNotificationsRead(user.id); }, [user]);
  const handleMarkOneRead = useCallback((id) => markNotificationRead(id), []);
  const handleAddNotification = useCallback((title, message, type, link) => {
    if (user) addNotification(user.id, title, message, type, link);
  }, [user]);

  const value = {
    user, isAuthenticated, login, logout,
    notifications, unreadCount,
    markAllRead: handleMarkAllRead,
    markOneRead: handleMarkOneRead,
    addNotification: handleAddNotification,
    _tick: tick,            // expose so children can depend on it if needed
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

/* Custom hook that re-renders on mock-data mutations */
export function useDataRefresh() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);
  return tick;
}

export default AuthContext;
