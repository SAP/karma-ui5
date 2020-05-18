/**
 * @param {object} options
 * @param {import('router')} options.middleware
 * @param {string} options.basePath
 * @param {string} options.targetUrl
 */
module.exports.init = async function({middleware, basePath, targetUrl, log}) {
	const httpProxy = require("http-proxy");
	const proxy = httpProxy.createProxyServer({
		target: targetUrl,
		changeOrigin: true
	});
	middleware.use(basePath, (req, res, next) => {
		log.debug("Proxy: " + req.url);
		proxy.web(req, res, next);
	});
};
