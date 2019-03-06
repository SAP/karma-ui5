const httpProxy = jest.genMockFromModule("http-proxy");
httpProxy.createProxyServer = jest.fn(function() {
    return {
        web: jest.fn(function(req, res, next) {
            next();
        })
    };
});
module.exports = httpProxy;
