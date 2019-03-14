const server = jest.genMockFromModule("@ui5/server");
server.middleware = {
	serveResources: () => {
		return function(req, res, next) {
			next();
		};
	},
	serveThemes: () => {
		return function(req, res, next) {
			next();
		};
	}
};
module.exports = server;
