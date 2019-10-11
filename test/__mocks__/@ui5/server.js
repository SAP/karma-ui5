const server = jest.genMockFromModule("@ui5/server");
server.middlewareRepository = {
	getMiddleware: (name) => {
		if (name === "serveResources" || name === "serveThemes") {
			return function() {
				return function(req, res, next) {
					next();
				};
			};
		}
	}
};
module.exports = server;
