const fs = require("fs").promises;
const path = require("path");
const mkdirp = require("mkdirp");

const defaultPath = "./karma-ui5-reports";

async function getUniqueFileName(fileName) {
	async function fileExists(path) {
		try {
			await fs.access(path);
			return true;
		} catch (err) {
			if (err.code === "ENOENT") {
				return false;
			}
			throw err;
		}
	}

	const fileExtension = path.extname(fileName);
	const fileNameWithoutExtension = fileName.slice(0, fileName.lastIndexOf(fileExtension));
	for (let index = 1; await fileExists(fileName); index++) {
		fileName = `${fileNameWithoutExtension}_${index}${fileExtension}`;
	}

	return fileName;
}

const FileExportReporter = function(baseReporterDecorator, config, logger) {
	let reporterInProcess = true;
	let reporterCompleted = function() {};
	const log = logger.create("reporter.ui5--fileExport");
	const reporterConfig = config.ui5.fileExport;
	const multiBrowsers = config.browsers && config.browsers.length > 1;
	let outputDir = reporterConfig.outputDir;

	if (!outputDir || typeof outputDir !== "string") {
		outputDir = defaultPath;
	}

	outputDir = path.join(config.basePath, outputDir);

	log.debug("outputDir is: " + outputDir);

	baseReporterDecorator(this);

	async function writeSingleFile(outputFile, content) {
		log.info(`Writing file: ${outputFile}`);
		await mkdirp(path.dirname(outputFile));
		outputFile = await getUniqueFileName(outputFile);
		try {
			await fs.writeFile(outputFile, content);
			log.info(`Saved file '${outputFile}'`);
		} catch (err) {
			log.warn("Failed to write file\n\t" + err.message);
		}
	}

	this.onBrowserComplete = async function(browser, result) {
		log.debug("onBrowserComplete triggered.");
		if (!result || result.error || result.disconnected) {
			log.debug("skipped due to incomplete test run.");
			return;
		}

		if (!result.exportFiles) {
			log.debug("No export files provided");
			return;
		}

		for (const file of result.exportFiles) {
			const pathSegments = [outputDir, path.basename(file.name)];
			if (multiBrowsers) {
				pathSegments.splice(1, 0, path.basename(browser.name));
			}

			await writeSingleFile(path.join.apply(null, pathSegments), file.content);
		}
		reporterInProcess = false;
		reporterCompleted();
	};

	this.onExit = function(done) {
		if (reporterInProcess) {
			reporterCompleted = done;
		} else {
			done();
		}
	};
};

FileExportReporter.$inject = ["baseReporterDecorator", "config", "logger"];

module.exports = FileExportReporter;
