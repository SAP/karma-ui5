let FileExportReporter;

async function handleError({error, logger}) {
	const _logger = logger.create("ui5.framework");
	_logger.log("error", error.stack);
	const {ErrorMessage} = await import("./errors.js");
	throw new Error(ErrorMessage.failure());
}

async function init(config, logger) {
	try {
		const Framework = (await import("./framework.js")).default;
		const framework = new Framework();
		await framework.init({config, logger});
	} catch (error) {
		await handleError({error, logger});
	}
	if (!FileExportReporter) {
		try {
			FileExportReporter = (await import("./fileExportReporter.js")).default;
		} catch (error) {
			await handleError({error, logger});
		}
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

function initFileExportReporter(baseReporterDecorator, config, logger) {
	if (!FileExportReporter) {
		throw new Error(`Unable to instantiate FileExportReporter. "ui5" framework hasn't been loaded yet.`);
	}
	return new FileExportReporter(baseReporterDecorator, config, logger);
}
initFileExportReporter.$inject = ["baseReporterDecorator", "config", "logger"];

module.exports = {
	"framework:ui5": ["factory", init],
	"middleware:ui5--beforeMiddleware": ["factory", getBeforeMiddleware],
	"middleware:ui5--middleware": ["factory", getMiddleware],
	"reporter:ui5--fileExport": ["factory", initFileExportReporter]
};
