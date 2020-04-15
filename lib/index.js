const {ErrorMessage} = require("./errors");
const Framework = require("./framework");
const framework = new Framework();

async function init(config, logger, filesPromise) {
	try {
		await framework.init({config, logger, filesPromise});
	} catch (error) {
		const _logger = logger.create("ui5.framework");
		_logger.log("error", error.stack);
		throw new Error(ErrorMessage.failure());
	}
}
init.$inject = ["config", "logger", "filesPromise"];

module.exports = {
	"framework:ui5": ["factory", init],
	"middleware:ui5--beforeMiddleware": ["value", framework.beforeMiddleware],
	"middleware:ui5--middleware": ["value", framework.middleware]
};
