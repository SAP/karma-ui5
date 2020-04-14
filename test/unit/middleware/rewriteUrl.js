const test = require("ava");
const rewriteUrl = require("../../../lib/middleware/rewriteUrl");

const assertRewriteToFileSystem = (t, config, [url, expectedUrl]) => {
	t.is(rewriteUrl._rewriteToFileSystem(url, config), expectedUrl);
};

test("_rewriteToFileSystem should not rewrite urls for application", (t) => {
	const config = {
		ui5: {
			type: "application"
		}
	};
	assertRewriteToFileSystem(t, config, [
		"/base/resources/sap/ui/foo/library.js",
		"/base/resources/sap/ui/foo/library.js"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/test-resources/sap/ui/foo/test.js",
		"/base/test-resources/sap/ui/foo/test.js"
	]);
});

test("_rewriteToFileSystem should rewrite urls for library", (t) => {
	const config = {
		ui5: {
			type: "library",
			paths: {
				src: "src",
				test: "test"
			}
		}
	};
	assertRewriteToFileSystem(t, config, [
		"/base/resources/sap/ui/foo/library.js",
		"/base/src/sap/ui/foo/library.js"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/test-resources/sap/ui/foo/test.js",
		"/base/test/sap/ui/foo/test.js"
	]);
});

test("_rewriteToFileSystem should rewrite urls for library with custom paths", (t) => {
	const config = {
		ui5: {
			type: "library",
			paths: {
				src: "src/main/js",
				test: "src/test/js"
			}
		}
	};
	assertRewriteToFileSystem(t, config, [
		"/base/src/main/resources/sap/ui/foo.js",
		"/base/src/main/js/sap/ui/foo.js"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/src/main/test-resources/sap/ui/foo/test.js",
		"/base/src/test/js/sap/ui/foo/test.js"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/src/test/resources/sap/ui/foo.js",
		"/base/src/main/js/sap/ui/foo.js"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/src/test/test-resources/sap/ui/foo/test.js",
		"/base/src/test/js/sap/ui/foo/test.js"
	]);
});

test("_rewriteToFileSystem should not rewrite unrelated urls for library", (t) => {
	const config = {
		ui5: {
			type: "library",
			paths: {
				src: "src/main/js",
				test: "src/test/js"
			}
		}
	};
	assertRewriteToFileSystem(t, config, [
		"/context.html",
		"/context.html"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/foo.js",
		"/base/foo.js"
	]);
});

test("_rewriteToFileSystem should not rewrite url when no type is given", (t) => {
	const config = {
		ui5: {}
	};
	assertRewriteToFileSystem(t, config, [
		"/base/resources/sap/ui/foo/library.js",
		"/base/resources/sap/ui/foo/library.js"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/test-resources/sap/ui/foo/test.js",
		"/base/test-resources/sap/ui/foo/test.js"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/src/main/resources/sap/ui/foo.js",
		"/base/src/main/resources/sap/ui/foo.js"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/src/main/test-resources/sap/ui/foo/test.js",
		"/base/src/main/test-resources/sap/ui/foo/test.js"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/src/test/resources/sap/ui/foo.js",
		"/base/src/test/resources/sap/ui/foo.js"
	]);
	assertRewriteToFileSystem(t, config, [
		"/base/src/test/test-resources/sap/ui/foo/test.js",
		"/base/src/test/test-resources/sap/ui/foo/test.js"
	]);
});


const assertRewriteToVirtual = (t, config, [url, expectedUrl]) => {
	t.is(rewriteUrl._rewriteToVirtual(url, config), expectedUrl);
};

test("_rewriteToVirtual should rewrite url for application", (t) => {
	const config = {
		ui5: {
			type: "application",
			paths: {
				webapp: "webapp"
			}
		}
	};

	// Good path
	assertRewriteToVirtual(t, config, [
		"/base/webapp/resources/sap-ui-core.js",
		"/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/webapp/test-resources/sap/ui/test/",
		"/test-resources/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/webapp/foo.js",
		"/foo.js"
	]);

	// Sad path (no rewrite)
	assertRewriteToVirtual(t, config, [
		"/webapp/resources/sap-ui-core.js",
		"/webapp/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/webapp/test-resources/sap/ui/test/",
		"/webapp/test-resources/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/resources/sap-ui-core.js",
		"/base/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/test-resources/sap/ui/test/",
		"/base/test-resources/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/resources/sap-ui-core.js",
		"/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/test-resources/sap/ui/test/",
		"/test-resources/sap/ui/test/"
	]);
});

test("_rewriteToVirtual should rewrite url for application with deep webapp path", (t) => {
	const config = {
		ui5: {
			type: "application",
			paths: {
				webapp: "src/main/webapp"
			}
		}
	};

	// Good path
	assertRewriteToVirtual(t, config, [
		"/base/src/main/webapp/resources/sap-ui-core.js",
		"/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/src/main/webapp/test-resources/sap/ui/test/",
		"/test-resources/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/src/main/webapp/foo.js",
		"/foo.js"
	]);

	// Sad path (no rewrite)
	assertRewriteToVirtual(t, config, [
		"/webapp/resources/sap-ui-core.js",
		"/webapp/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/webapp/test-resources/sap/ui/test/",
		"/webapp/test-resources/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/resources/sap-ui-core.js",
		"/base/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/test-resources/sap/ui/test/",
		"/base/test-resources/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/resources/sap-ui-core.js",
		"/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/test-resources/sap/ui/test/",
		"/test-resources/sap/ui/test/"
	]);
});

test("_rewriteToVirtual should rewrite url for library", (t) => {
	const config = {
		ui5: {
			type: "library",
			paths: {
				src: "src",
				test: "test"
			}
		}
	};

	// Good path
	assertRewriteToVirtual(t, config, [
		"/base/src/sap-ui-core.js",
		"/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/test/sap/ui/test/",
		"/test-resources/sap/ui/test/"
	]);
	// TODO: is this expected? (see code)
	// assertRewriteToVirtual(t, config, [
	// 	"/base/foo.js",
	// 	"/foo.js"
	// ]);

	// Sad path (no rewrite)
	assertRewriteToVirtual(t, config, [
		"/src/sap-ui-core.js",
		"/src/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/test/sap/ui/test/",
		"/test/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/webapp/resources/sap-ui-core.js",
		"/webapp/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/webapp/test-resources/sap/ui/test/",
		"/webapp/test-resources/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/resources/sap-ui-core.js",
		"/base/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/test-resources/sap/ui/test/",
		"/base/test-resources/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/resources/sap-ui-core.js",
		"/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/test-resources/sap/ui/test/",
		"/test-resources/sap/ui/test/"
	]);
});

test("_rewriteToVirtual should not rewrite url when no type is given", (t) => {
	const config = {
		ui5: {}
	};
	assertRewriteToVirtual(t, config, [
		"/base/webapp/resources/sap-ui-core.js",
		"/base/webapp/resources/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/webapp/test-resources/sap/ui/test/",
		"/base/webapp/test-resources/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/webapp/foo.js",
		"/base/webapp/foo.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/src/sap-ui-core.js",
		"/base/src/sap-ui-core.js"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/test/sap/ui/test/",
		"/base/test/sap/ui/test/"
	]);
	assertRewriteToVirtual(t, config, [
		"/base/foo.js",
		"/base/foo.js"
	]);
});
