const path = require("path");
const {ErrorMessage} = require("../errors");
const {
	createProjectFilesPattern,
	exists
} = require("../utils");

module.exports.init = async function(config, log) {
	const webappFolder = config.ui5.paths.webapp;
	if (!exists(path.join(config.basePath, webappFolder))) {
		log.error(ErrorMessage.applicationFolderNotFound(webappFolder));
		throw new Error(ErrorMessage.failure());
	}

	// Match all files (including dotfiles)
	config.files.push(
		createProjectFilesPattern(config.basePath + `/{${webappFolder}/**,${webappFolder}/**/.*}`)
	);
};
