import { useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

/**
 * useAuth — Firebase authentication hook.
 *
 * Handles:
 * - Persistent login via onAuthStateChanged listener
 * - Google popup sign-in
 * - Token retrieval for Socket.IO auth
 * - Sign out with cleanup
 * - Auth popup failure recovery
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until initial auth check completes
  const [error, setError] = useState(null);

  // Listen for auth state changes (handles page reload / persistent session)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sign in with Google popup
  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (err) {
      console.error('[Auth] Google sign-in failed:', err);

      // Handle common popup errors
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Multiple popup requests — ignore
      } else {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Get the Firebase ID token (for Socket.IO auth)
  const getToken = useCallback(async () => {
    if (!user) return null;
    try {
      return await user.getIdToken(/* forceRefresh */ false);
    } catch (err) {
      console.error('[Auth] Token retrieval failed:', err);
      return null;
    }
  }, [user]);

  // Sign out
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('[Auth] Sign out failed:', err);
    }
  }, []);

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    getToken,
    logout,
    isAuthenticated: !!user,
  };
}
