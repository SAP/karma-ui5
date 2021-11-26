const {ErrorMessage} = require("./errors");
const Framework = require("./framework");
const FileExportReporter = require("./fileExportReporter");

async function init(config, logger) {
	try {
		const framework = new Framework();
		await framework.init({config, logger});
	} catch (error) {
		const _logger = logger.create("ui5.framework");
		_logger.log("error", error.stack);
		throw new Error(ErrorMessage.failure());
	}
}
init.$inject = ["config", "logger"];

function getBeforeMiddleware(ui5) {
	return ui5._beforeMiddleware;
}
function getMiddleware(ui5) {
	return ui5._middleware;
}
getBeforeMiddleware.$inject = getMiddleware.$inject = ["config.ui5"];

module.exports = {
	"framework:ui5": ["factory", init],
	"middleware:ui5--beforeMiddleware": ["factory", getBeforeMiddleware],
	"middleware:ui5--middleware": ["factory", getMiddleware],
	"reporter:ui5--fileExport": ["type", FileExportReporter]
};
