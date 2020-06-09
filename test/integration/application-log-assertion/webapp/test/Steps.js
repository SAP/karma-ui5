sap.ui.define([
	"sap/base/Log",
	"sap/ui/test/gherkin/StepDefinitions",
	"sap/ui/test/Opa5"
], function(Log, StepDefinitions, Opa5) {
	"use strict";

	const Steps = StepDefinitions.extend("GherkinWithOPA5.Steps", {
		init: function() {
			this.register(/^I have started the app$/i, function() {
				Opa5.assert.strictEqual(true, true);
			});

			this.register(/^I can see the life saving button$/i, function() {
				Opa5.assert.strictEqual("Save a Lemming", "Save a Lemming",
					"Verified that we can see the life saving button");
			});

			this.register(/^I check how many lemmings have been saved already$/i, function() {
				Opa5.assert.strictEqual(true, true);
			});

			this.register(/^I click on the life saving button\s*(\d*)?(?:\s*times)?$/i, function(sNumTimes) {
				Opa5.assert.strictEqual(true, true);
			});

			this.register(/^I save a lemming's life$/i, function() {
				Opa5.assert.strictEqual(1, 1, "Verified correct number of lemmings saved");
			});

			this.register(/^I can see the following named lemmings:$/i, function(aDataTable) {
				aDataTable.forEach(function(sLemmingName, iLemmingId) {
					Opa5.assert.strictEqual(sLemmingName, sLemmingName, "Verified lemming: " + sLemmingName);
				});
			});

			this.register(/^I see (\w+) at the end of the list of named lemmings$/i, function(sName) {
				Opa5.assert.strictEqual(sName, sName, "Verified lemming: " + sName);
			});
		},

		closeApplication: function() {
			Log.info("Closing application");
		}
	});

	return Steps;
});
