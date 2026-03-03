// API Configuration - use .env for production/tunnel, fallback for local backend.
// Ensure URL has a protocol (http/https); "localhost:5000" alone causes "Unsupported Protocol" errors.
function normalizeApiUrl(url) {
  if (!url || typeof url !== 'string') return 'http://localhost:5000';
  const trimmed = url.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}
const API_URL = normalizeApiUrl(process.env.REACT_APP_API_URL);

export default API_URL;
