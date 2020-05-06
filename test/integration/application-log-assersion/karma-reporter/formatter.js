"use strict";

const _ = require("lodash");

module.exports = function(history) {
	const cucumberJson = [];

	_.forEach(history, function(feature, featureName) {
		const elements = [];
		const identifier = _.split(featureName, " ");
		const tag = identifier[0];
		const name = identifier.slice(1).join(" ");

		_.forEach(feature, function(scenario, scenarioName) {
			elements.push({
				name: scenarioName,
				type: "scenario",
				keyword: "Scenario",
				steps: _.map(scenario, function(step) {
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
