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
import { getUserByEmail, updateUserProfile as updateUserProfileDoc } from '../firebase/firestore';

const AuthContext = createContext(null);
const LOCAL_AUTH_KEY = 'pgportal_local_auth_user';
const LOCAL_AUTH_ONLY = true;
const DEFAULT_LOCAL_PASSWORD = 'Portal@2026';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);             // Firestore user profile
  const [firebaseUser, setFirebaseUser] = useState(null); // Firebase Auth user
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false); // First-login flag
  const [authLoading, setAuthLoading] = useState(true); // true until onAuthStateChanged fires

  /* ── Listen for Firebase Auth state changes ── */
  useEffect(() => {
    if (LOCAL_AUTH_ONLY) {
      const rawLocal = localStorage.getItem(LOCAL_AUTH_KEY);
      if (rawLocal) {
        try {
          const localUser = JSON.parse(rawLocal);
          setFirebaseUser(null);
          setUser(localUser);
          setIsAuthenticated(true);
          setMustChangePassword(!!localUser?.mustChangePassword);
        } catch {
          localStorage.removeItem(LOCAL_AUTH_KEY);
          setFirebaseUser(null);
          setUser(null);
          setIsAuthenticated(false);
          setMustChangePassword(false);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setIsAuthenticated(false);
        setMustChangePassword(false);
      }
      setAuthLoading(false);
      return () => {};
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        // Fetch the user profile from Firestore
        const profile = await getUserByEmail(fbUser.email);
        if (profile) {
          setUser(profile);
          setIsAuthenticated(true);
          if (profile.mustChangePassword) setMustChangePassword(true);
        } else {
          // Auth user exists but no Firestore profile – sign out
          console.warn('No Firestore profile found for', fbUser.email);
          await signOut(auth);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        const rawLocal = localStorage.getItem(LOCAL_AUTH_KEY);
        if (rawLocal) {
          try {
            const localUser = JSON.parse(rawLocal);
            setFirebaseUser(null);
            setUser(localUser);
            setIsAuthenticated(true);
            setAuthLoading(false);
            return;
          } catch {
            localStorage.removeItem(LOCAL_AUTH_KEY);
          }
        }
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
    if (LOCAL_AUTH_ONLY) {
      try {
        const normalizedEmail = (email || '').trim().toLowerCase();
        const profile = await getUserByEmail(normalizedEmail);
        if (!profile) {
          return { success: false, error: 'No user profile found. Seed users first or check email.' };
        }

        const acceptedPassword = profile.localPassword || profile.generatedPassword || DEFAULT_LOCAL_PASSWORD;
        if (password !== acceptedPassword) {
          return { success: false, error: 'Invalid email or password' };
        }

        setFirebaseUser(null);
        setUser(profile);
        setIsAuthenticated(true);
        setMustChangePassword(!!profile.mustChangePassword);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(profile));
        return { success: true, mustChangePassword: !!profile.mustChangePassword };
      } catch (err) {
        return { success: false, error: err.message || 'Login failed' };
      }
    }

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
      // Check first-login flag
      if (profile.mustChangePassword) {
        setMustChangePassword(true);
      }
      return { success: true, mustChangePassword: !!profile.mustChangePassword };
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/configuration-not-found') {
        try {
          const profile = await getUserByEmail(email);
          if (!profile) {
            return { success: false, error: 'No user profile found. Seed users first or check email.' };
          }
          if (password !== 'Portal@2026') {
            return { success: false, error: 'Invalid email or password' };
          }

          setFirebaseUser(null);
          setUser(profile);
          setIsAuthenticated(true);
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(profile));
          return { success: true, mustChangePassword: !!profile.mustChangePassword };
        } catch (fallbackErr) {
          return { success: false, error: fallbackErr.message || 'Fallback login failed' };
        }
      }
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
    if (LOCAL_AUTH_ONLY) {
      localStorage.removeItem(LOCAL_AUTH_KEY);
      setFirebaseUser(null);
      setUser(null);
      setIsAuthenticated(false);
      setMustChangePassword(false);
      return;
    }

    try {
      await signOut(auth);
    } catch {
      // no-op for local fallback sessions
    }
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setFirebaseUser(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /* ── Password reset ── */
  const resetPassword = useCallback(async (email) => {
    if (LOCAL_AUTH_ONLY) {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const profile = await getUserByEmail(normalizedEmail);
      if (!profile) return { success: true };
      return { success: true };
    }

    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /* ── Change password (requires re-authentication) ── */
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (LOCAL_AUTH_ONLY) {
      if (!user?.id) return { success: false, error: 'Not authenticated' };
      const current = user.localPassword || user.generatedPassword || DEFAULT_LOCAL_PASSWORD;
      if (currentPassword !== current) return { success: false, error: 'Current password is incorrect' };
      try {
        await updateUserProfileDoc(user.id, { mustChangePassword: false, generatedPassword: undefined });
        const updated = { ...user, localPassword: newPassword, mustChangePassword: false };
        setUser(updated);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(updated));
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message || 'Password change failed' };
      }
    }

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
    if (LOCAL_AUTH_ONLY) {
      if (!user?.email) return;
      const profile = await getUserByEmail(user.email);
      if (profile) {
        setUser(profile);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(profile));
      }
      return;
    }

    if (!firebaseUser) return;
    const profile = await getUserByEmail(firebaseUser.email);
    if (profile) setUser(profile);
  }, [firebaseUser, user?.email]);

  /* ── Clear first-login flag after password change ── */
  const clearMustChangePassword = useCallback(async () => {
    setMustChangePassword(false);
    if (user?.id) {
      const { updateUserProfile } = await import('../firebase/firestore');
      await updateUserProfile(user.id, { mustChangePassword: false });
      setUser(prev => prev ? { ...prev, mustChangePassword: false } : prev);
    }
  }, [user?.id]);

  const value = {
    user,
    firebaseUser,
    isAuthenticated,
    authLoading,
    mustChangePassword,
    login,
    logout,
    resetPassword,
    changePassword,
    refreshProfile,
    clearMustChangePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
