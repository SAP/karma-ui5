const {replaceLast} = require("../utils");

module.exports.toFileSystem = function(url, config) {
	const {type, paths} = config.ui5 || {};
	if (!type) {
		// TODO: do we want no type to be allowed?
		return url;
	} else if (type === "application") {
		return url; // no rewrite required
	} else if (type === "library") {
		const srcFolder = paths.src;
		const testFolder = paths.test;

		const srcResourcesPattern = new RegExp(`^/base/${replaceLast(srcFolder, "resources/")}`);
		const srcTestResourcesPattern = new RegExp(`^/base/${replaceLast(srcFolder, "test-resources/")}`);
		const testResourcesPattern = new RegExp(`^/base/${replaceLast(testFolder, "resources/")}`);
		const testTestResourcesPattern = new RegExp(`^/base/${replaceLast(testFolder, "test-resources/")}`);

		if (srcResourcesPattern.test(url)) {
			return url.replace(srcResourcesPattern, `/base/${srcFolder}/`);
		} else if (srcTestResourcesPattern.test(url)) {
			return url.replace(srcTestResourcesPattern, `/base/${testFolder}/`);
		} else if (testResourcesPattern.test(url)) {
			return url.replace(testResourcesPattern, `/base/${srcFolder}/`);
		} else if (testTestResourcesPattern.test(url)) {
			return url.replace(testTestResourcesPattern, `/base/${testFolder}/`);
		}
	} else {
		// this.logger.log("error", ErrorMessage.urlRewriteFailed(type));
		// TODO
		return;
	}

	return url;
};

module.exports.toVirtual = function(url, config) {
	const {type, paths} = config.ui5 || {};
	if (!type) {
		// TODO: do we want no type to be allowed?
		return url;
	} else if (type === "application") {
		const webappFolder = paths.webapp;
		const webappPattern = new RegExp(`^/base/${webappFolder}/`);
		if (webappPattern.test(url)) {
			return url.replace(webappPattern, "/");
		}
	} else if (type === "library") {
		const srcFolder = paths.src;
		const testFolder = paths.test;
		const srcPattern = new RegExp(`^/base/${srcFolder}/`);
		const testPattern = new RegExp(`^/base/${testFolder}/`);
		// const basePattern = /^\/base\//; // TODO: is this expected?
		if (srcPattern.test(url)) {
			return url.replace(srcPattern, "/resources/");
		} else if (testPattern.test(url)) {
			return url.replace(testPattern, "/test-resources/");
		} /* else if (basePattern.test(url)) {
			return url.replace(basePattern, "/");
		}*/
	} else {
		// this.logger.log("error", ErrorMessage.urlRewriteFailed(type));
		this.logger.log("error", "TODO");
		return;
	}

	return url;
};
