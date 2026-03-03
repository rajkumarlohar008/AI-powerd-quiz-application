const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Proxy only /api to the backend. Other requests (e.g. hot-update, static) stay on the dev server.
 * This avoids "Proxy error" for /MERN-Quiz-App/main.*.hot-update.json (ECONNREFUSED).
 */
module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );
};
