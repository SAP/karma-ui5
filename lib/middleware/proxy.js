module.exports.init = async function(middleware, basePath, url) {
	const httpProxy = require("http-proxy");
	const proxy = httpProxy.createProxyServer({
		target: url,
		changeOrigin: true
	});
	middleware.use(basePath, (req, res, next) => {
		proxy.web(req, res, next);
	});
};
