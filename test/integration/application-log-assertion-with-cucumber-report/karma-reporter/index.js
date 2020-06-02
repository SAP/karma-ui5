"use strict";

const writer = require("./writer");

const CucumberReporter = function(baseReporterDecorator, config, logger, helper) {
	const log = logger.create("reporter.testReporter");
	const reporterConfig = config.testReporter || {};
	const out = reporterConfig.out;
	const specs = [];

	baseReporterDecorator(this);

	this.adapters = [function(msg) {
		process.stdout.write.bind(process.stdout)(msg);
	}];

	this.onSpecComplete = function(browser, result) {
		specs.push(result);
	};

	this.onRunComplete = function() {
		const jsonResult = JSON.stringify(specs, null, 2) + "\n";
		writer(helper, out, log, jsonResult);
	};
};

CucumberReporter.$inject = ["baseReporterDecorator", "config", "logger", "helper"];

module.exports = {
	"reporter:testReporter": ["type", CucumberReporter]
};
