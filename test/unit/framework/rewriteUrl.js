import test from "ava";
import sinonGlobal from "sinon";
import {ErrorMessage} from "../../../lib/errors.js";

import Framework from "../../../lib/framework.js";

test.beforeEach(async (t) => {
	t.context.sinon = sinonGlobal.createSandbox();

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

test.afterEach.always((t) => {
	t.context.sinon.restore();
});

const assertRewriteUrl = (t, [input, expected]) => {
	t.is(t.context.framework.rewriteUrl(input), expected);
};

test("Should rewrite url for application", (t) => {
	const {framework} = t.context;

	framework.config.ui5.type = "application";

	// Good path
	assertRewriteUrl(t, [
		"/base/webapp/resources/sap-ui-core.js",
		"/resources/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/base/webapp/test-resources/sap/ui/test/",
		"/test-resources/sap/ui/test/"
	]);
	assertRewriteUrl(t, [
		"/base/webapp/foo.js",
		"/foo.js"
	]);

	// Sad path (no rewrite)
	assertRewriteUrl(t, [
		"/webapp/resources/sap-ui-core.js",
		"/webapp/resources/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/webapp/test-resources/sap/ui/test/",
		"/webapp/test-resources/sap/ui/test/"
	]);
	assertRewriteUrl(t, [
		"/base/resources/sap-ui-core.js",
		"/base/resources/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/base/test-resources/sap/ui/test/",
		"/base/test-resources/sap/ui/test/"
	]);
	assertRewriteUrl(t, [
		"/resources/sap-ui-core.js",
		"/resources/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/test-resources/sap/ui/test/",
		"/test-resources/sap/ui/test/"
	]);
});

test("rewriteUrl: Should rewrite url for library", (t) => {
	const {framework} = t.context;

	framework.config.ui5.type = "library";

	// Good path
	assertRewriteUrl(t, [
		"/base/src/sap-ui-core.js",
		"/resources/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/base/test/sap/ui/test/",
		"/test-resources/sap/ui/test/"
	]);
	// TODO: is this expected? (see code)
	// assertRewriteUrl(t, [
	// 	"/base/foo.js",
	// 	"/foo.js"
	// ]);

	// Sad path (no rewrite)
	assertRewriteUrl(t, [
		"/src/sap-ui-core.js",
		"/src/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/test/sap/ui/test/",
		"/test/sap/ui/test/"
	]);
	assertRewriteUrl(t, [
		"/webapp/resources/sap-ui-core.js",
		"/webapp/resources/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/webapp/test-resources/sap/ui/test/",
		"/webapp/test-resources/sap/ui/test/"
	]);
	assertRewriteUrl(t, [
		"/base/resources/sap-ui-core.js",
		"/base/resources/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/base/test-resources/sap/ui/test/",
		"/base/test-resources/sap/ui/test/"
	]);
	assertRewriteUrl(t, [
		"/resources/sap-ui-core.js",
		"/resources/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/test-resources/sap/ui/test/",
		"/test-resources/sap/ui/test/"
	]);
});

test("rewriteUrl: Should not rewrite url when no type is given", (t) => {
	const {framework} = t.context;

	framework.config.ui5.type = undefined;

	assertRewriteUrl(t, [
		"/base/webapp/resources/sap-ui-core.js",
		"/base/webapp/resources/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/base/webapp/test-resources/sap/ui/test/",
		"/base/webapp/test-resources/sap/ui/test/"
	]);
	assertRewriteUrl(t, [
		"/base/webapp/foo.js",
		"/base/webapp/foo.js"
	]);
	assertRewriteUrl(t, [
		"/base/src/sap-ui-core.js",
		"/base/src/sap-ui-core.js"
	]);
	assertRewriteUrl(t, [
		"/base/test/sap/ui/test/",
		"/base/test/sap/ui/test/"
	]);
	assertRewriteUrl(t, [
		"/base/foo.js",
		"/base/foo.js"
	]);
});

test("rewriteUrl: Should throw error when invalid type is given", (t) => {
	const {sinon, framework} = t.context;

	framework.config.ui5.type = "foo";

	const loggerSpy = sinon.spy(framework.logger, "log");

	framework.rewriteUrl("/foo");

	t.is(loggerSpy.callCount, 1);
	t.deepEqual(loggerSpy.getCall(0).args, ["error", ErrorMessage.urlRewriteFailed("foo")]);
});
