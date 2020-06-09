const {ErrorMessage} = require("./errors");
const Framework = require("./framework");
const framework = new Framework();

async function init(config, logger) {
	try {
		await framework.init({config, logger});
	} catch (error) {
		const _logger = logger.create("ui5.framework");
		_logger.log("error", error.message);
		_logger.log("debug", error.stack);
		throw new Error(ErrorMessage.failure());
	}
}

init.$inject = ["config", "logger"];

module.exports = {
	"framework:ui5": ["factory", init],
	"middleware:ui5--pauseRequests": ["factory", function() {
		return framework.pauseRequests();
	}],
	"middleware:ui5--serveResources": ["factory", function() {
		return framework.serveResources();
	}],
	"middleware:ui5--serveThemes": ["factory", function() {
		return framework.serveThemes();
	}]
};
