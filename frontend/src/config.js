// API configuration for Vite

function normalizeApiUrl(url) {

  if (!url || typeof url !== 'string') {
    return '';
  }

  return url.replace(/\/+$/, '');
}

// Vite environment variable
const configuredUrl = normalizeApiUrl(
  import.meta.env.VITE_API_URL
);

console.log(import.meta.env.VITE_API_URL);

// Detect environment
const isDevelopment = import.meta.env.DEV;
console.log(configuredUrl);

// Final API URL
const API_URL = configuredUrl || (
  isDevelopment
    ? ''
    : window.location.origin
);

export default API_URL;