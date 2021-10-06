const path = require("path");
const fs = require("fs");

const pluginName = "CustomFilesReporter";
const defaultPath = "./custom-files";

let CustomFilesReporter = function (baseReporterDecorator, config, logger, helper) {
	let log = logger.create("reporter.customFiles");
	let reporterConfig = config.customFilesReporter || {};
	let outputDir = reporterConfig.outputDir;

	if (!outputDir || outputDir.trim && outputDir.trim() === "") {
		outputDir = defaultPath;
	}

	outputDir = helper.normalizeWinPath(path.resolve(config.basePath, outputDir)) + path.sep;

	log.debug(pluginName + ": outputDir is: %s", outputDir);

	baseReporterDecorator(this);

	function writeSingleFile(outputFile, content) {
		log.info(pluginName + ": Writing file: %s", outputFile);
		helper.mkdirIfNotExists(path.dirname(outputFile), function () {
			fs.writeFile(outputFile, content, function (err) {
				if (err) {
					log.warn(pluginName + ": Failed to write file\n\t" + err.message);
				} else {
					log.info(pluginName + ": Saved file '%s'.", outputFile);
				}
			});
		});
	}

	this.onBrowserComplete = function(browser, result) {
		log.debug(pluginName + ": onBrowserComplete triggered.");
		if (!result || result.error || result.disconnected) {
			log.debug(pluginName + ": skipped due to incomplete test run.");
			return;
		}

		if(!result.customFiles) {
			log.info(pluginName + ": No custom files provided");
			return;
		}

		result.customFiles.forEach(function (oFile) {
			writeSingleFile(path.join(outputDir, oFile.name), oFile.content);
		});
	};
};

CustomFilesReporter.$inject = ["baseReporterDecorator", "config", "logger", "helper"];

module.exports = CustomFilesReporter;
