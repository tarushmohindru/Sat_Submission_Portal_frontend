import api from '../lib/axios';

/**
 * Exchange a Firebase ID token for a portal session token.
 */
export const authenticateUser = async (idToken) => {
  const response = await api.post('/users/auth', { idToken });
  return response.data;
};
