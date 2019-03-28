const istanbulLibCoverage = require("istanbul-lib-coverage");
require("./discovery.js");

(function(window) {
	const karma = window.__karma__;

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
					"Could not find a testsuite or no testpage defined.\n"
					+ "Please set a testpage in the config or via CLI.\n"
					+ "For more details: https://github.com/SAP/karma-ui5#defining-testpage"]
				);
				return;
			}

			if (aTestsuites.length !== 1) {
				const testsuitePaths = aTestsuites.map(function(testsuite) {
					return testsuite.replace(/^\/base\//, "");
				});
				karma.log("error", [
					"No testpage is configured but multiple testsuites have been found:\n\n"
					+ testsuitePaths.join("\n")
					+ "\n\n"
					+ "Please explicitly configure a \"testpage\" in your karma config or via CLI:\n"
					+ "https://github.com/SAP/karma-ui5#defining-testpage"]);
				return;
			}

			config.testpage = aTestsuites[0];
		}

		config.testpage = prependBase(config.testpage);

		window.findTests(config.testpage).then(function(testpages) {
			runTests(testpages.map(function(testpage) {
				return testpage["fullpage"];
			}));
		}, function(e) {
			// console.error("fail");
			karma.log("error", e.message);
			// TODO: report error
		});

		function getTestsuites(files) {
			return Object.keys(files).filter(function(path) {
				return /\.qunit\.html$/.test(path) && /\/testsuite\./.test(path);
			});
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
						// Test page done

						// Merge test page coverage into global coverage object
						mergeCoverage(testWindow.contentWindow.__coverage__);

						// Run next test or trigger completion
						if (i < testpages.length - 1) {
							testWindow.close();
							testWindow = null;
							runTestPage(i + 1);
						} else {
							karma.complete({
								coverage: coverageMap ? coverageMap.toJSON() : undefined
							});
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
