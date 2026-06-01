import { useState, useEffect, useCallback } from 'react';
import { auth, googleProvider, firebaseConfigured } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [error, setError] = useState(
    firebaseConfigured ? null : 'Firebase is not configured. Please add your Firebase credentials to the environment variables.'
  );

  useEffect(() => {
    if (!firebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!firebaseConfigured || !auth) {
      setError('Firebase is not configured.');
      return;
    }
    try {
      setError(null);
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (err) {
      console.error('[Auth] Google sign-in failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // ignore
      } else {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const getToken = useCallback(async () => {
    if (!user) return null;
    try {
      return await user.getIdToken(false);
    } catch (err) {
      console.error('[Auth] Token retrieval failed:', err);
      return null;
    }
  }, [user]);

  const logout = useCallback(async () => {
    if (!auth) return;
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
