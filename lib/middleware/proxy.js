/**
 * @param {object} options
 * @param {import('router')} options.middleware
 * @param {string} options.basePath
 * @param {string} options.targetUrl
 */
module.exports.init = async function({middleware, basePath, targetUrl, log}) {
	const http = require("http");
	const agent = new http.Agent({keepAlive: true});
	const httpProxy = require("http-proxy");
	const proxy = httpProxy.createProxyServer({
		target: targetUrl,
		changeOrigin: true,
		agent
	});
	middleware.use(basePath, (req, res, next) => {
		log.debug("Proxy: " + req.url);
		proxy.web(req, res, next);
	});
};
