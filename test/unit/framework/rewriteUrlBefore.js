import test from "ava";

import Framework from "../../../lib/framework.js";

test.beforeEach(async (t) => {
	const logger = {
		create: function() {
			return {
				type: "",
				message: "",
				log: function(type, message) {
					this.type = type;
					this.message = message;
				},
			};
		}
	};

	t.context.framework = new Framework();
	t.context.framework.exists = () => true;
	t.context.framework.applyUI5Middleware = function() {};
	await t.context.framework.init({config: { }, logger});
});

const assertRewriteUrlBefore = (t, [input, expected]) => {
	t.is(t.context.framework.rewriteUrlBefore(input), expected);
};

test("Rewrite url for library", (t) => {
	const {framework} = t.context;

	framework.config.ui5.type = "library";

	// Good path
	assertRewriteUrlBefore(t, [
		"/base/resources/sap-ui-core.js",
		"/base/src/sap-ui-core.js",
	]);
	assertRewriteUrlBefore(t, [
		"/base/test-resources/sap/ui/test/",
		"/base/test/sap/ui/test/"
	]);

	// Sad path (no rewrite)
	assertRewriteUrlBefore(t, [
		"/base/src/sap-ui-core.js",
		"/base/src/sap-ui-core.js"
	]);
	assertRewriteUrlBefore(t, [
		"/base/test/sap/ui/test/",
		"/base/test/sap/ui/test/"
	]);
});

test("Rewrite url for library (nested paths)", (t) => {
	const {framework} = t.context;

	framework.config.ui5.type = "library";
	framework.config.ui5.paths = {
		src: "src/main/js",
		test: "src/test/js"
	};

	// Good path
	assertRewriteUrlBefore(t, [
		"/base/src/main/resources/sap-ui-core.js",
		"/base/src/main/js/sap-ui-core.js",
	]);
	assertRewriteUrlBefore(t, [
		"/base/src/test/test-resources/sap/ui/test/",
		"/base/src/test/js/sap/ui/test/"
	]);

	assertRewriteUrlBefore(t, [
		"/base/src/test/resources/sap-ui-core.js",
		"/base/src/main/js/sap-ui-core.js",
	]);
	assertRewriteUrlBefore(t, [
		"/base/src/main/test-resources/sap/ui/test/",
		"/base/src/test/js/sap/ui/test/"
	]);

	// Sad path (no rewrite)
	assertRewriteUrlBefore(t, [
		"/base/src/main/js/sap-ui-core.js",
		"/base/src/main/js/sap-ui-core.js"
	]);
	assertRewriteUrlBefore(t, [
		"/base/src/test/js/sap/ui/test/",
		"/base/src/test/js/sap/ui/test/"
	]);
});

test("Should not rewrite url for type application", (t) => {
	const {framework} = t.context;

	framework.config.ui5.type = "application";

	assertRewriteUrlBefore(t, [
		"/base/webapp/resources/sap-ui-core.js",
		"/base/webapp/resources/sap-ui-core.js"
	]);
	assertRewriteUrlBefore(t, [
		"/base/webapp/test-resources/sap/ui/test/",
		"/base/webapp/test-resources/sap/ui/test/"
	]);
	assertRewriteUrlBefore(t, [
		"/base/webapp/foo.js",
		"/base/webapp/foo.js"
	]);
	assertRewriteUrlBefore(t, [
		"/base/src/sap-ui-core.js",
		"/base/src/sap-ui-core.js"
	]);
	assertRewriteUrlBefore(t, [
		"/base/test/sap/ui/test/",
		"/base/test/sap/ui/test/"
	]);
	assertRewriteUrlBefore(t, [
		"/base/foo.js",
		"/base/foo.js"
	]);
});

test("Should not rewrite url when no type is given", (t) => {
	const {framework} = t.context;

	framework.config.ui5.type = undefined;

	assertRewriteUrlBefore(t, [
		"/base/webapp/resources/sap-ui-core.js",
		"/base/webapp/resources/sap-ui-core.js"
	]);
	assertRewriteUrlBefore(t, [
		"/base/webapp/test-resources/sap/ui/test/",
		"/base/webapp/test-resources/sap/ui/test/"
	]);
	assertRewriteUrlBefore(t, [
		"/base/webapp/foo.js",
		"/base/webapp/foo.js"
	]);
	assertRewriteUrlBefore(t, [
		"/base/src/sap-ui-core.js",
		"/base/src/sap-ui-core.js"
	]);
	assertRewriteUrlBefore(t, [
		"/base/test/sap/ui/test/",
		"/base/test/sap/ui/test/"
	]);
	assertRewriteUrlBefore(t, [
		"/base/foo.js",
		"/base/foo.js"
	]);
});
