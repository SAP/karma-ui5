// Export istanbul-lib-coverage to be bundled with webpack for browser usage
const istanbulLibCoverage = require("istanbul-lib-coverage");

(function(window) {
	const karma = window.__karma__;

	karma.start = function() {
		const config = karma.config && karma.config.ui5 || {};

		const prependBase = (path) => /^\/base\//.test(path) ? path : `/base/${path}`;

		const windowUtil = function(url, onload) {
			const context = {
				close: function() {
					if (config.useIframe) {
						document.body.removeChild(context._frame);
					} else {
						context._window.close();
					}
				}
			};

			if (config.useIframe) {
				context._frame = document.createElement("iframe");
				context._frame.onload = function() {
					onload.call(null, context);
				};
				context._frame.setAttribute("style", "height: 1024px; width: 1280px;");
				context._frame.src = url;
				document.body.appendChild(context._frame);
				context.contentWindow = context._frame.contentWindow;
			} else {
				context._window = window.open(url);
				context.contentWindow = context._window;
				context._window.addEventListener("load", function() {
					onload.call(null, context);
				});
			}
			karma.setupContext(context.contentWindow);
		};

		if (!config.testrunner) {
			karma.log("error", ["No testrunner URL configured."]);
			return;
		}

		if (config.testrunner) {
			if (!config.testpage) {
				const aTestsuites = getTestsuites(karma.files);

				if (aTestsuites.length === 0) {
					karma.log("error", [
						"Could not find a testsuite or no testpage defined.\n"
						+ "Please set a testpage in the config or via CLI.\n"
						+ "For more details: https://github.com/SAP/karma-ui5#defining-testpage"]
					);
					return;
				}

				if (aTestsuites.length !== 1) {
					karma.log("error", [
						"Multiple testsuites have been found in your project."
						+ "Execution of multiple testsuites is not allowed.\n"
						+ "Please explicitly define a testpage in your karma config or via CLI.\n"
						+ "For reference: https://github.com/SAP/karma-ui5#defining-testpage"]);
					return;
				}

				config.testpage = aTestsuites[0];
			}

			config.testrunner = prependBase(config.testrunner);
			config.testpage = prependBase(config.testpage);

			windowUtil(config.testrunner, function(testRunner) {
				if (window.top) {
					window.top.jsUnitTestSuite = testRunner.contentWindow.jsUnitTestSuite;
				} else {
					window.jsUnitTestSuite = testRunner.contentWindow.jsUnitTestSuite;
				}

				testRunner.contentWindow.sap.ui.qunit.TestRunner.checkTestPage(config.testpage)
					.then(function(testpages) {
						testRunner.close();
						runTests(testpages);
					}, function(e) {
						// console.error("fail");
						karma.log("error", [e.message]);
						return;
						// TODO: report error
					});
			});
		}

		function getTestsuites(files) {
			return Object.keys(files).filter((path) => path.endsWith(".qunit.html") && path.includes("/testsuite."));
		}

		function runTests(testpages) {
			let totalNumberOfTest = 0; let coverageMap;

			function mergeCoverage(coverage) {
				if (!coverage) {
					return;
				}
				if (!coverageMap) {
					coverageMap = istanbulLibCoverage.createCoverageMap();
				}
				coverageMap.merge(coverage);
			}

			function runTestPage(i) {
				if (i >= testpages.length) {
					karma.complete({
						coverage: coverageMap ? coverageMap.toJSON() : undefined
					});
					return;
				}


				const qunitHtmlFile = testpages[i];
				windowUtil(qunitHtmlFile, function(testWindow) {
					const QUnit = testWindow.contentWindow.QUnit;
					let timer = null;
					let testResult = {};

					if (QUnit.begin) {
						QUnit.begin(function(args) {
							totalNumberOfTest += args.totalTests;
							karma.info({total: totalNumberOfTest});
						});
					}

					QUnit.done(function() {
						// Test page done - cleanup and run next page
						if (testWindow) {
							mergeCoverage(testWindow.contentWindow.__coverage__);
							testWindow.close();
							testWindow = null;
							runTestPage(i + 1);
						}
					});

					QUnit.testStart(function(test) {
						timer = new Date().getTime();
						testResult = {success: true, errors: []};
					});

					QUnit.log(function(details) {
						if (!details.result) {
							let msg = "";

							if (details.message) {
								msg += details.message + "\n";
							}

							if (typeof details.expected !== "undefined") {
								msg += "Expected: " + QUnit.dump.parse(details.expected) + "\n"
									+ "Actual: " + QUnit.dump.parse(details.actual) + "\n";
							}

							if (details.source) {
								msg += details.source + "\n";
							}

							testResult.success = false;
							testResult.errors.push(msg);
						}
					});

					QUnit.testDone(function(test) {
						const result = {
							description: test.name,
							suite: test.module && [qunitHtmlFile, test.module] || [],
							success: testResult.success,
							log: testResult.errors || [],
							time: new Date().getTime() - timer
						};

						karma.result(result);
					});
				});
			}

			runTestPage(0);
		}
	};
})(typeof window !== "undefined" ? window : global);
