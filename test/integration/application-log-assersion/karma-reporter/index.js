"use strict";

const _ = require("lodash");

const formatter = require("./formatter");
const writer = require("./writer");

const CucumberReporter = function(baseReporterDecorator, config, logger, helper) {
	const log = logger.create("reporter.cucumber");
	const reporterConfig = config.cucumberReporter || {};
	const out = reporterConfig.out || "stdout";
	const history = {};

	baseReporterDecorator(this);

	this.adapters = [function(msg) {
		process.stdout.write.bind(process.stdout)(msg);
	}];

	this.onSpecComplete = function(browser, result) {
		const suite = result.suite[1];
		const scenario = result.description;
		const step = result.suite[3];

		if (!reporterConfig.prefix || reporterConfig.prefix && _.startsWith(suite, reporterConfig.prefix)) {
			history[suite] = history[suite] || {};
			history[suite][scenario] = history[suite][scenario] || [];
			if (step) {
				history[suite][scenario].push(result);
			}
		}
	};

	this.onRunComplete = function() {
		const cucumberJson = formatter(history);
		const jsonResult = JSON.stringify(cucumberJson, null, 2) + "\n";

		if (out === "stdout") {
			process.stdout.write(jsonResult);
		} else {
			writer(helper, out, log, jsonResult);
		}
	};
};

CucumberReporter.$inject = ["baseReporterDecorator", "config", "logger", "helper", "formatError"];

module.exports = {
	"reporter:cucumber": ["type", CucumberReporter]
};
