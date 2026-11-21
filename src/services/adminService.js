import api from '../lib/axios';

// Admin session token: sessionStorage, so it is dropped when the tab closes.
const KEY = 'adminToken';

export const getAdminToken = () => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const setAdminToken = (token) => {
  try {
    if (token) sessionStorage.setItem(KEY, token);
    else sessionStorage.removeItem(KEY);
  } catch {
    // sessionStorage unavailable; the admin will just need to log in again
  }
};

const authHeader = () => ({ headers: { Authorization: `Bearer ${getAdminToken()}` } });

export const adminLogin = async (password) => {
  const response = await api.post('/admin/login', { password });
  return response.data;
};

export const getOverview = async () => {
  const response = await api.get('/admin/overview', authHeader());
  return response.data;
};

export const addLeader = async (leader) => {
  const response = await api.post('/admin/leaders', leader, authHeader());
  return response.data;
};

export const deleteLeader = async (email) => {
  const response = await api.delete(`/admin/leaders/${encodeURIComponent(email)}`, authHeader());
  return response.data;
};
