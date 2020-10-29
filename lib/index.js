const {ErrorMessage} = require("./errors");
const Framework = require("./framework");
const framework = new Framework();

async function init(config, logger) {
	try {
		await framework.init({config, logger});
	} catch (error) {
		const _logger = logger.create("ui5.framework");
		_logger.log("error", error.stack);
		throw new Error(ErrorMessage.failure());
	}
}
init.$inject = ["config", "logger"];

function getBeforeMiddleware(config) {
	return config.ui5._beforeMiddleware;
}
function getMiddleware(config) {
	return config.ui5._middleware;
}
getBeforeMiddleware.$inject = getMiddleware.$inject = ["config"];

module.exports = {
	"framework:ui5": ["factory", init],
	"middleware:ui5--beforeMiddleware": ["factory", getBeforeMiddleware],
	"middleware:ui5--middleware": ["factory", getMiddleware]
};
