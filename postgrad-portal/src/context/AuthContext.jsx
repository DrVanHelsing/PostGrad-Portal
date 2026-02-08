// ============================================
// PostGrad Portal – Auth Context (Firebase)
// ============================================

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserByEmail } from '../firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);             // Firestore user profile
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase Auth user
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // true until onAuthStateChanged fires

  /* ── Listen for Firebase Auth state changes ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Fetch the user profile from Firestore
        const profile = await getUserByEmail(fbUser.email);
        if (profile) {
          setUser(profile);
          setIsAuthenticated(true);
        } else {
          // Auth user exists but no Firestore profile – sign out
          console.warn('No Firestore profile found for', fbUser.email);
          await signOut(auth);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setIsAuthenticated(false);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  /* ── Login with email/password ── */
  const login = useCallback(async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserByEmail(cred.user.email);
      if (!profile) {
        await signOut(auth);
        return { success: false, error: 'No user profile found. Contact your administrator.' };
      }
      setFirebaseUser(cred.user);
      setUser(profile);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.code === 'auth/too-many-requests'
        ? 'Too many failed attempts. Please try again later.'
        : err.message || 'Login failed';
      return { success: false, error: msg };
    }
  }, []);

  /* ── Logout ── */
  const logout = useCallback(async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /* ── Password reset ── */
  const resetPassword = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /* ── Change password (requires re-authentication) ── */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) return { success: false, error: 'Not authenticated' };
      // Re-authenticate
      const credential = EmailAuthProvider.credential(fbUser.email, currentPassword);
      await reauthenticateWithCredential(fbUser, credential);
      // Update password
      await updatePassword(fbUser, newPassword);
      return { success: true };
    } catch (err) {
      console.error('Change password error:', err);
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Current password is incorrect'
        : err.code === 'auth/weak-password'
        ? 'New password is too weak (min 6 characters)'
        : err.message || 'Password change failed';
      return { success: false, error: msg };
    }
  }, []);

  /* ── Refresh user profile from Firestore ── */
  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    const profile = await getUserByEmail(firebaseUser.email);
    if (profile) setUser(profile);
  }, [firebaseUser]);

  const value = {
    user,
    firebaseUser,
    isAuthenticated,
    authLoading,
    login,
    logout,
    resetPassword,
    changePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
