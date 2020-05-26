/**
 * @param {object} options
 * @param {import('router')} options.middleware
 * @param {string} options.basePath
 * @param {string} options.targetUrl
 */
module.exports.init = async function({middleware, basePath, targetUrl, log}) {
	const http = require("http");
	const https = require("https");
	const httpProxy = require("http-proxy");
	const {parse: parseUrl} = require("url");
	const {protocol} = parseUrl(targetUrl);
	const Agent = protocol === "https:" ? https.Agent : http.Agent;
	const agent = new Agent({keepAlive: true});
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
