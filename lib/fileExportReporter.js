const fs = require("fs").promises;
const path = require("path");
const mkdirp = require("mkdirp");

const defaultPath = "./karma-ui5-reports";

function escapeFileName(fileName) {
	fileName = fileName.replace(/[:*?"<>|]/g, "");
	fileName = fileName.replace(/[\\/]/g, ".");
	return fileName;
}

async function getUniqueFileName(exportDir, fileName) {
	async function fileExists(_fileName) {
		try {
			await fs.access(path.join(exportDir, _fileName));
			return true;
		} catch (err) {
			if (err.code === "ENOENT") {
				return false;
			}
			throw err;
		}
	}

	const fileExtension = path.extname(fileName);
	const fileNameWithoutExtension = path.basename(fileName, fileExtension);
	for (let index = 1; await fileExists(fileName); index++) {
		fileName = `${fileNameWithoutExtension}_${index}${fileExtension}`;
	}

	return fileName;
}

const FileExportReporter = function(baseReporterDecorator, config, logger) {
	let reporterInProcess = true;
	let exitCode = 0;
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

	async function writeSingleFile(fileDir, fileName, content) {
		await mkdirp(fileDir);
		const uniqueFileName = await getUniqueFileName(fileDir, fileName);
		const pathToWrite = path.join(fileDir, uniqueFileName);
		if (!pathToWrite.startsWith(fileDir)) {
			log.warn(`Invalid export file path: ${pathToWrite}\n\tMake sure the file path is in directory: ${fileDir}`);
			return;
		}
		log.debug(`Writing file: ${pathToWrite}`);
		try {
			await fs.writeFile(pathToWrite, content);
			log.info(`Saved file '${pathToWrite}'`);
		} catch (err) {
			log.warn("Failed to write file " + pathToWrite + "\n\t" + err.message);
		}
	}

	this.onBrowserComplete = async function(browser, result) {
		try {
			log.debug("onBrowserComplete triggered.");
			if (!result || result.error || result.disconnected) {
				log.debug("skipped due to incomplete test run.");
				return;
			}

			if (!result.exportFiles) {
				log.debug("No export files provided");
				return;
			}

			if (!Array.isArray(result.exportFiles)) {
				log.warn("Export files must be given as an array");
				return;
			}

			let exportPath = outputDir;
			if (multiBrowsers) {
				exportPath = path.join(exportPath, escapeFileName(browser.name));
			}
			for (const file of result.exportFiles) {
				if (typeof file.name !== "string" || typeof file.content !== "string") {
					log.warn("Invalid file object. \"name\" and \"content\" must be strings");
					continue;
				}

				await writeSingleFile(exportPath, escapeFileName(file.name), file.content);
			}
		} catch (err) {
			log.error("An unexpected error occured while exporting files\n\t" + err.message);
			exitCode = 1;
		}
		reporterInProcess = false;
		reporterCompleted();
	};

	this.onExit = function(done) {
		if (reporterInProcess) {
			reporterCompleted = () => done(exitCode);
		} else {
			done(exitCode);
		}
	};
};

FileExportReporter.$inject = ["baseReporterDecorator", "config", "logger"];

module.exports = FileExportReporter;
