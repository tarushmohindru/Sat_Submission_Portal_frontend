import { useState, useEffect, useRef } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { authenticateUser } from '../services/authService';
import { getErrorMessage } from '../lib/errors';
import { AuthContext } from './auth-context';
import { toast } from 'react-toastify';

// The portal session token is stored in localStorage; the axios request
// interceptor (lib/axios.js) attaches it to every API request.
const clearStoredToken = () => {
  try {
    localStorage.removeItem('token');
  } catch {
    // localStorage may be unavailable; nothing to clear
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [teamData, setTeamData] = useState(null);
  const authAttemptRef = useRef(null); // Track auth attempts to prevent loops

  useEffect(() => {
    const clearSession = () => {
      setUser(null);
      setIsAuthenticated(false);
      setTeamData(null);
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // User signed out - clear everything
        authAttemptRef.current = null;
        clearSession();
        setIsLoading(false);
        return;
      }

      // Prevent infinite loop: if we're already processing this user, skip
      const currentUid = firebaseUser.uid;
      if (authAttemptRef.current === currentUid) {
        return;
      }

      try {
        setIsLoading(true);
        authAttemptRef.current = currentUid;

        // Prove the sign-in to the backend with a Firebase ID token.
        const idToken = await firebaseUser.getIdToken();
        const authResponse = await authenticateUser(idToken);

        try {
          if (authResponse?.token) {
            localStorage.setItem('token', authResponse.token);
          }
        } catch (err) {
          console.warn('[AUTH] Could not persist token to localStorage', err);
        }

        authAttemptRef.current = null;

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          teamId: authResponse.teamId,
          ...authResponse,
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error(
          'Backend authentication failed:',
          error.response?.status ?? error.code ?? 'no response',
          error.response?.data?.error ?? error.message
        );
        authAttemptRef.current = null;
        clearStoredToken();
        clearSession();

        // Always sign out of Firebase on failure. If the Firebase session were
        // kept (e.g. after a network error or 5xx), the next "Sign in" click
        // would return the same user, onAuthStateChanged would not fire again,
        // and the login button would stay on "Signing in..." forever.
        try {
          await auth.signOut();
        } catch (signOutError) {
          console.warn('[AUTH] Firebase sign-out failed', signOutError);
        }

        const status = error.response?.status;
        if (status === 401 || status === 403) {
          // The backend rejected this account (invalid/revoked token or no
          // verified email): show the server's reason.
          toast.error(getErrorMessage(error, 'Could not sign you in with this account.'));
        } else {
          toast.error(getErrorMessage(error, 'Authentication failed. Please try again.'));
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    // Auth is a Bearer token in localStorage; logging out is client-side only.
    clearStoredToken();
    setUser(null);
    setIsAuthenticated(false);
    setTeamData(null);
    await auth.signOut();
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    teamData,
    setTeamData,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
