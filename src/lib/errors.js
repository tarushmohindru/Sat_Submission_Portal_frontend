/**
 * Turn an axios error into a message for the user.
 * The server's JSON payload lives on `error.response.data`.
 */
export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  const data = error?.response?.data;
  if (Array.isArray(data?.details) && data.details.length) return data.details.join(', ');
  if (typeof data?.details === 'string') return data.details;
  if (typeof data?.error === 'string') return data.error;
  if (!error?.response) return 'Network error — check your connection and try again.';
  return fallback;
};
