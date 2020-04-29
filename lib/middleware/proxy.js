/**
 * @param {object} options
 * @param {import('router')} options.middleware
 * @param {string} options.basePath
 * @param {string} options.targetUrl
 */
module.exports.init = async function({middleware, basePath, targetUrl}) {
	const httpProxy = require("http-proxy");
	const proxy = httpProxy.createProxyServer({
		target: targetUrl,
		changeOrigin: true
	});
	middleware.use(basePath, (req, res, next) => {
		proxy.web(req, res, next);
	});
};
