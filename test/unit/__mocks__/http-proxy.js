const httpProxy = jest.genMockFromModule("http-proxy");
httpProxy.createProxyServer = jest.fn(function() {
	return {
		web: jest.fn(),
		on: jest.fn()
	};
});
module.exports = httpProxy;
