"use strict";

var _ = require("lodash");

var formatter = require("./formatter");
var writer = require("./writer");

var CucumberReporter = function (baseReporterDecorator, config, logger, helper) {
    var log = logger.create("reporter.cucumber");
    var reporterConfig = config.cucumberReporter || {};
    var out = reporterConfig.out || "stdout";
    var history = {};

    baseReporterDecorator(this);

    this.adapters = [function (msg) {
        process.stdout.write.bind(process.stdout)(msg);
    }];

    this.onSpecComplete = function (browser, result) {
        var suite = result.suite[1];
        var scenario = result.description;
        var step = result.suite[3];

        if (!reporterConfig.prefix || reporterConfig.prefix && _.startsWith(suite, reporterConfig.prefix)) {
            history[suite] = history[suite] || {};
            history[suite][scenario] = history[suite][scenario] || [];
            if (step) {
                history[suite][scenario].push(result);
            }
        }
    };

    this.onRunComplete = function () {
        var cucumberJson = formatter(history);
        var jsonResult = JSON.stringify(cucumberJson, null, 2) + "\n";

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
