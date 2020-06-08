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

module.exports = function() {
	console.log("meeeeh");
};

module.exports["framework:ui5"] = ["factory", init];
module.exports["middleware:ui5--pauseRequests"] = ["factory", function() {
	return framework.pauseRequests();
}];
module.exports["middleware:ui5--serveResources"] = ["factory", function() {
	return framework.serveResources();
}];
module.exports["middleware:ui5--serveThemes"] = ["factory", function() {
	return framework.serveThemes();
}];
