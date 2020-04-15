module.exports.init = async function(middleware, url) {
	const httpProxy = require("http-proxy");
	const proxy = httpProxy.createProxyServer({
		target: url,
		changeOrigin: true
	});
	middleware.use("/base/webapp/", (req, res, next) => {
		proxy.web(req, res, next);
	});
};
