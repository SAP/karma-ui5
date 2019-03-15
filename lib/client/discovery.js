/*!
 * ${copyright}
 */

/*
 * IMPORTANT: This is a private module, its API must not be used and is subject to change.
 * Code other than the Core tests must not yet introduce dependencies to this module.
 */

(function() {

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
		if (sTestPage.startsWith("/test-resources/test-resources") || sTestPage.startsWith("/test-resources/resources")) {
			sTestPage = sTestPage.slice("/test-resources".length);
		}
		this.aPages.push(Object.assign({fullpage: sTestPage}, oConfig));
	};

	function getFile(sUrl, fnCallback) {
		var request = new XMLHttpRequest();
		request.open("GET", sUrl, true);
		request.onload = function() {
			if (request.status >= 200 && request.status < 400) {
				// Success!
				fnCallback(null, request.responseText);
			} else {
				// We reached our target server, but it returned an error
				fnCallback(new Error("Request failed"));
			}
		};

		request.onerror = function(err) {
			// There was a connection error of some sort
			fnCallback(err);
		};

		request.send();
	}

	function findPages(sEntryPage, progressCallback) {

		function checkTestPage(oTestPageConfig) {

			return new Promise(function(resolve, reject) {

				// console.log("checking test page: " + sTestPage);
				let url = new URL(oTestPageConfig.fullpage, location.href);
				if ( !/testsuite[_.]/.test(url.pathname) ) {
					resolve(oTestPageConfig);
					return;
				}

				if ( progressCallback ) {
					progressCallback(oTestPageConfig.fullpage);
				}

				// check for an existing test page and check for test suite or page
				getFile(oTestPageConfig.fullpage, function(err, sData) {
					if (err) {
						var tex = err;
						// var text = (xhr ? xhr.status + " " : "") + (msg || status || 'unspecified error');
						console.error("Failed to load page '" + oTestPageConfig.fullpage + "': " + text);
						resolve(Object.assign({error: text}, oTestPageConfig));
						return;
					}

					if (/(?:window\.suite\s*=|function\s*suite\s*\(\s*\)\s*{)/.test(sData)
							|| (/data-sap-ui-testsuite/.test(sData) && !/sap\/ui\/test\/starter\/run-test/.test(sData)) ) {

						// console.log("execute page ", sTestPage);

						var frame = document.createElement("iframe");

						var onSuiteReady = function onSuiteReady(oIFrame) {
							findTestPages(oIFrame).then(function(aTests) {
								if (frame.parentNode) {
									frame.parentNode.removeChild(frame);
								}
								resolve(Object.assign({
									tests: aTests,
									simple: aTests.every((test) => !test.suite)
								}, oTestPageConfig));
							}, function(oError) {
								console.error("failed to load page '" + oTestPageConfig.fullpage + "'");
								if (frame.parentNode) {
									frame.parentNode.removeChild(frame);
								}
								resolve(Object.assign({error: oError}, oTestPageConfig));
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
						let url = new URL(oTestPageConfig.fullpage, document.baseURI);
						url.searchParams.set("sap-ui-xx-noless","true");
						frame.src = url;
						document.body.appendChild(frame);
					} else {
						resolve(oTestPageConfig);
					}
				});

			});

		}

		function sequence(aPages) {
			// console.log("before sequence:", aPages);
			return aPages.reduce( (lastPromise, pageConfig) => {
				return lastPromise.then( (lastResult) => {
					return checkTestPage(pageConfig).then( (pageResult) => {
						lastResult.push(pageResult);
						return lastResult;
					});
				});
			}, Promise.resolve([])).then( (a) => {
				// console.log("after sequence:", a);
				return a;
			});
		}

		/* function parallel(aPages) {
			return Promise.all( aPages.map( (page) => checkTestPage(page) ) );
		} */

		function decorateWithTestsuite(aPages, sTestsuite) {
			aPages.forEach( (test) => {
				if ( test.testsuite === undefined ) {
					test.testsuite = sTestsuite;
				}
			});
			return aPages;
		}

		function findTestPages(oIFrame) {
			return Promise.resolve(oIFrame.contentWindow.suite()).
				then( (oSuite) => (oSuite && oSuite.getTestPages() || []) ).
				then( (aPages) => (decorateWithTestsuite(aPages, oIFrame.src))).
				then( (aPages) => sequence(aPages) ).
				catch( () => [] );
		}

		var origTestSuite = window.jsUnitTestSuite;
		window.jsUnitTestSuite = TestSuite;
		return checkTestPage({fullpage: sEntryPage}).finally(function() {
			window.jsUnitTestSuite = origTestSuite;
		});

	}

	window.findTestsuites = function(sEntryPage, progressCallback) {
		return findPages(sEntryPage, progressCallback).then( (result) => {
			let allSuites = [];
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
		return findPages(entryPage, progressCallback).then( (result) => {
			let allTests = [];
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

});
