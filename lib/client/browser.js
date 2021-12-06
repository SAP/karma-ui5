const istanbulLibCoverage = require("istanbul-lib-coverage");
require("./discovery.js");

const patternTestResources = /(?:^|[^?#]*\/)(?:test-)?(?:resources|webapp)\/(.*)/;
const patternGenericTeststarter = /([^?#]+)\.qunit\.html\?testsuite=test-resources\/((?:[^/]+\/)*testsuite(?:[.a-z0-9]+)?\.qunit)&test=([^&]+)(?:&|$)/;
const patternSpecificTeststarter = /([^?#]+)\.qunit\.html\?test=([^&]+)(?:&|$)/;
const patternAnyTest = /([^?#]*)[?#](?:.*)/;

function getTestPageName(qunitHtmlFile) {
	let matches;
	let result;

	matches = qunitHtmlFile.match(patternTestResources);
	if (matches) {
		qunitHtmlFile = matches[1];
	}

	matches = qunitHtmlFile.match(patternGenericTeststarter);
	if (matches) {
		result = matches[2] + "--" + matches[3];
	}

	if (!result) {
		matches = qunitHtmlFile.match(patternSpecificTeststarter);
		if (matches) {
			result = matches[1] + "--" + matches[2];
		}
	}

	if (!result) {
		matches = qunitHtmlFile.match(patternAnyTest);
		if (matches) {
			result = matches[1];
		}
	}

	if (!result) {
		result = qunitHtmlFile;
	}

	result = result.replace(/\.qunit\.html/g, "");
	result = result.replace(/\.qunit\./g, "--");
	result = result.replace(/\.qunit--/g, "--");

	return result;
}

(function(window) {
	const karma = window.__karma__;
	const exportFiles = [];

	function reportSetupFailure(description, error) {
		karma.info({total: 1});
		karma.result({
			description: description,
			suite: [],
			success: false,
			log: error ? [error] : [],
			time: 0
		});
		karma.complete({});
	}

	function setFullSize(element) {
		element.style.height = "100%";
		element.style.padding = "0";
		element.style.margin = "0";
	}

	// Set karma execution frame to full size, so that the iframe can use width/height 100%
	setFullSize(document.documentElement);
	setFullSize(document.body);

	karma.start = function() {
		const config = karma.config && karma.config.ui5 || {};

		const prependBase = function(path) {
			return /^\/base\//.test(path) ? path : "/base/" + path;
		};

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
				context._frame.style.height = "100%";
				context._frame.style.width = "100%";
				context._frame.style.border = "0";
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

		if (!config.testpage) {
			const aTestsuites = getTestsuites(karma.files);

			if (aTestsuites.length === 0) {
				karma.log("error", [
					"Could not find a testsuite or no testpage defined.\n" +
					"Please set a testpage in the config or via CLI.\n" +
					"For more details: https://github.com/SAP/karma-ui5#testpage"]
				);
				// reportSetupFailure(); // TODO
				return;
			}

			if (aTestsuites.length !== 1) {
				const testsuitePaths = aTestsuites.map(function(testsuite) {
					return testsuite.replace(/^\/base\//, "");
				});
				karma.log("error", [
					"No testpage is configured but multiple testsuites have been found:\n\n" +
					testsuitePaths.join("\n") +
					"\n\n" +
					"Please explicitly configure a \"testpage\" in your karma config or via CLI:\n" +
					"https://github.com/SAP/karma-ui5#testpage"]);
				// reportSetupFailure(); // TODO
				return;
			}

			config.testpage = aTestsuites[0];
		}

		config.testpage = prependBase(config.testpage);

		window.findTests(config.testpage).then(function(testpages) {
			if (!testpages || testpages.length === 0) {
				reportSetupFailure("Could not resolve any testpages!");
				return;
			}
			runTests(testpages.map(function(testpage) {
				return testpage["fullpage"];
			}));
		}, function(err) {
			reportSetupFailure("Error resolving testsuite: " + err.fullpage, err.error);
		});

		function getTestsuites(files) {
			return Object.keys(files).filter(function(path) {
				return /\.qunit\.html$/.test(path) && /\/testsuite\./.test(path);
			});
		}

		function addUrlParameters(testpageUrl) {
			if (!config.urlParameters) {
				return testpageUrl;
			}

			const url = new URL(testpageUrl, document.location.href);
			config.urlParameters.forEach(function(urlParameter) {
				url.searchParams.append(urlParameter.key, urlParameter.value);
			});
			// Sort params for consistency between browsers (probably caused by polyfill)
			url.searchParams.sort();

			return url.toString();
		}

		function runTests(testpages) {
			let totalNumberOfTest = 0;
			let coverageMap;

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
				const qunitHtmlFile = addUrlParameters(testpages[i]);

				windowUtil(qunitHtmlFile, function(testWindow) {
					let timer = null;
					let testResult = {};
					let QUnit;
					let accessError = false;
					try {
						QUnit = testWindow.contentWindow.QUnit;
					} catch (err) {
						if (err.name === "TypeError" && err.message === "Permission denied") {
							accessError = true;
						} else {
							throw err;
						}
					}

					function testFinished() {
						// Merge test page coverage into global coverage object
						if (!accessError) {
							mergeCoverage(testWindow.contentWindow.__coverage__);

							if (config.fileExport) {
								const testPageName = getTestPageName(qunitHtmlFile);
								(testWindow.contentWindow._$files || []).forEach((file) => {
									file.name = `TEST-${testPageName}-FILE-${file.name}`;
									exportFiles.push(file);
								});
							}
						}

						// Run next test or trigger completion
						if (i < testpages.length - 1) {
							testWindow.close();
							testWindow = null;
							runTestPage(i + 1);
						} else {
							// Also merge coverage results from karma window
							mergeCoverage(window.__coverage__);
							karma.complete({
								coverage: coverageMap ? coverageMap.toJSON() : undefined,
								exportFiles: config.fileExport ? exportFiles : undefined
							});
						}
					}

					if (!QUnit) {
						const log = [];
						if (accessError || !testWindow.contentWindow.document.querySelector("script")) {
							// Access Error (IE) or page doesn't have any script => probably 404
							log.push("Error while loading testpage");
						} else {
							// QUnit couldn't be loaded
							log.push("Missing QUnit framework");
						}
						// Report a test failure
						totalNumberOfTest += 1;
						karma.info({total: totalNumberOfTest});
						karma.result( {
							description: qunitHtmlFile,
							suite: [],
							success: false,
							log: log,
							time: 0
						});

						testFinished();
						return;
					}

					if (QUnit.begin) {
						QUnit.begin(function(args) {
							if (args.totalTests === 0) {
								if (config.failOnEmptyTestPage) {
									totalNumberOfTest += 1;
									karma.result({
										description: qunitHtmlFile,
										suite: [],
										success: false,
										log: ["Testpage did not define any tests."],
										time: 0
									});
								} else {
									// Don't report an error when option is not active
									// Can't be activated by default because of compatibility reasons
									karma.log("error", [
										"Testpage \"" + qunitHtmlFile + "\" did not define any tests.\n" +
										"Please consider enabling the \"failOnEmptyTestPage\" option " +
										"in your karma config or via CLI to fail the test run:\n" +
										"https://github.com/SAP/karma-ui5#failonemptytestpage"
									]);
								}
							} else {
								totalNumberOfTest += args.totalTests;
							}
							karma.info({total: totalNumberOfTest});
						});
					}

					QUnit.done(testFinished);

					QUnit.testStart(function(test) {
						timer = new Date().getTime();
						testResult = {success: true, errors: []};

						// Prevent false-positives when the "noglobals" config is enabled.
						// Code instrumented by istanbul introduces global variables
						// (cov_* for each file and a global __coverage__ variable).
						// Adding them to the already collected "pollution" list prevents issues
						// when the original "after" hook compares the list with the current state.
						const config = QUnit.config;
						if (!config.noglobals) {
							return;
						}
						const currentTest = config.current;
						const originalAfter = currentTest.after;
						currentTest.after = function(...args) {
							for (const key in testWindow.contentWindow) {
								if (
									Object.prototype.hasOwnProperty.call(testWindow.contentWindow, key) &&
									(key.indexOf("cov_") === 0 || key === "__coverage__") &&
									config.pollution.indexOf(key) === -1
								) {
									config.pollution.push(key);
								}
							}
							return originalAfter.apply(currentTest, args);
						};
					});

					QUnit.log(function(details) {
						if (!details.result) {
							let msg = "";

							if (details.message) {
								msg += details.message + "\n";
							}

							if (typeof details.expected !== "undefined") {
								msg += "Expected: " + QUnit.dump.parse(details.expected) + "\n" +
									"Actual: " + QUnit.dump.parse(details.actual) + "\n";
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
