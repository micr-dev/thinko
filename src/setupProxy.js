const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.DRAWINGS_PROXY_TARGET || 'http://127.0.0.1:4748',
      changeOrigin: true,
      pathRewrite: path => `/api${path}`,
    }),
  );
  app.use(
    '/agentation',
    createProxyMiddleware({
      target: process.env.AGENTATION_PROXY_TARGET || 'http://127.0.0.1:4747',
      changeOrigin: true,
      ws: true,
      pathRewrite: { '^/agentation': '' },
    }),
  );
};
