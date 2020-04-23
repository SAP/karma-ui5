"use strict";

var _ = require("lodash");

module.exports = function (history) {
    var cucumberJson = [];

    _.forEach(history, function (feature, featureName) {
        var elements = [];
        var identifier = _.split(featureName, " ");
        var tag = identifier[0];
        var name = identifier.slice(1).join(" ");

        _.forEach(feature, function (scenario, scenarioName) {
            elements.push({
                name: scenarioName,
                type: "scenario",
                keyword: "Scenario",
                steps: _.map(scenario, function (step) {
                    return {
                        keyword: "",
                        name: step.description,
                        result: {
                            duration: step.time * 1000000,
                            status: step.success ? "passed" : "failed"
                        }
                    };
                })
            });
        });

        cucumberJson.push({
            keyword: "Feature",
            name: name,
            uri: _.camelCase(name),
            tags: [{
                name: tag
            }],
            elements: elements
        });
    });

    return cucumberJson;
};
