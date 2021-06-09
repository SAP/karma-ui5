
(function(window) {
	const karma = window.__karma__;

	/*
	 * Simulate the same JSUnit Testsuite API as the TestRunner to collect the available test pages per suite
	 */
	function TestSuite() {
		this.aPages = [];
	}

	TestSuite.prototype.getTestPages = function() {
		return this.aPages;
	};

	TestSuite.prototype.addTestPage = function(sTestPage, oConfig) {
		// in case of running in the root context the testsuites right now
		// generate an invalid URL because they assume that test-resources is
		// the context path - this section makes sure to remove the duplicate
		// test-resources segments in the path
		if ( /^(\/test-resources\/(test-)?resources)/.test(sTestPage) ) {
			sTestPage = sTestPage.slice("/test-resources".length);
		}
		this.aPages.push(Object.assign({fullpage: sTestPage}, oConfig));
	};

	function getFile(sUrl) {
		return new Promise(function(resolve, reject) {
			const request = new XMLHttpRequest();
			request.open("GET", sUrl, true);
			request.onload = function() {
				if (request.status >= 200 && request.status < 400) {
					resolve(request.responseText);
				} else {
					reject(new Error("Request failed"));
				}
			};

			request.onerror = function(err) {
				reject(err);
			};

			request.send();
		});
	}

	function findPages(sEntryPage, progressCallback) {
		function checkTestPage(oTestPageConfig) {
			return new Promise(function(resolve, reject) {
				if ( !/testsuite[_.]/.test(oTestPageConfig.fullpage) ) {
					resolve(oTestPageConfig);
					return;
				}

				if ( progressCallback ) {
					progressCallback(oTestPageConfig.fullpage);
				}

				// check for an existing test page and check for test suite or page
				getFile(oTestPageConfig.fullpage).then(function(sData) {
					if (/(?:window\.suite\s*=|function\s*suite\s*\(\s*\)\s*{)/.test(sData) ||
							(/data-sap-ui-testsuite/.test(sData) && !/sap\/ui\/test\/starter\/runTest/.test(sData)) ||
							/sap\/ui\/test\/starter\/createSuite/.test(sData)) {
						// console.log("execute page ", sTestPage);

						const frame = document.createElement("iframe");

						const onSuiteReady = function onSuiteReady(oIFrame) {
							findTestPages(oIFrame).then(function(aTests) {
								if (frame.parentNode) {
									frame.parentNode.removeChild(frame);
								}

								const bPass = aTests.filter(function(test) {
									return !test.suite;
								}).length === aTests.length;

								resolve(Object.assign({
									tests: aTests,
									simple: bPass
								}, oTestPageConfig));
							}, function(oError) {
								karma.log("error", ["Failed to load page " + oTestPageConfig.fullpage]);
								karma.log("error", [oError]);
								if (frame.parentNode) {
									frame.parentNode.removeChild(frame);
								}
								reject(Object.assign({error: oError}, oTestPageConfig));
							});
						};

						frame.style.display = "none";
						frame.onload = function() {
							if (typeof this.contentWindow.suite === "function") {
								onSuiteReady(this);
							} else {
								// Wait for a CustomEvent in case window.suite isn't defined, yet
								this.contentWindow.addEventListener("sap-ui-testsuite-ready", function() {
									onSuiteReady(this);
								}.bind(this));
							}
						};

						const url = oTestPageConfig.fullpage;

						// TODO: Add polyfill
						// url.searchParams.set("sap-ui-xx-noless","true");
						frame.src = url;
						document.body.appendChild(frame);
					} else {
						resolve(oTestPageConfig);
					}
				}).catch(reject);
			});
		}

		function sequence(aPages) {
			return aPages.reduce( function(lastPromise, pageConfig) {
				return lastPromise.then( function(lastResult) {
					return checkTestPage(pageConfig).then( function(pageResult) {
						lastResult.push(pageResult);
						return lastResult;
					});
				});
			}, Promise.resolve([])).then( function(a) {
				return a;
			});
		}

		/* function parallel(aPages) {
			return Promise.all( aPages.map( (page) => checkTestPage(page) ) );
		} */

		function decorateWithTestsuite(aPages, sTestsuite) {
			aPages.forEach( function(test) {
				if ( test.testsuite === undefined ) {
					test.testsuite = sTestsuite;
				}
			});
			return aPages;
		}

		function findTestPages(oIFrame) {
			return Promise.resolve(oIFrame.contentWindow.suite()).
				then( function(oSuite) {
					return (oSuite && oSuite.getTestPages() || []);
				}).
				then( function(aPages) {
					return (decorateWithTestsuite(aPages, oIFrame.src));
				}).
				then( function(aPages) {
					return sequence(aPages);
				});
		}

		const origTestSuite = window.jsUnitTestSuite;
		const origTopTestSuite = top.jsUnitTestSuite;
		window.jsUnitTestSuite = TestSuite;
		top.jsUnitTestSuite = TestSuite;
		return checkTestPage({fullpage: sEntryPage}).finally(function() {
			window.jsUnitTestSuite = origTestSuite;
			top.jsUnitTestSuite = origTopTestSuite;
		});
	}

	window.findTestsuites = function(sEntryPage, progressCallback) {
		return findPages(sEntryPage, progressCallback).then( function(result) {
			const allSuites = [];
			function collect(test) {
				if ( Array.isArray(test.tests) ) {
					test.tests.forEach(collect);
					if ( test.simple ) {
						allSuites.push(test.fullpage);
					}
				}
			}
			collect(result);
			return allSuites;
		});
	};

	window.findTests = function(entryPage, progressCallback) {
		return findPages(entryPage, progressCallback).then( function(result) {
			const allTests = [];
			function collect(test) {
				if ( Array.isArray(test.tests) ) {
					test.tests.forEach(collect);
				} else {
					allTests.push(test);
				}
			}
			collect(result);
			return allTests;
		});
	};
})(window);
