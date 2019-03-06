var path = require('path');

var ABS_URL = /^https?:\/\//;
var isUrlAbsolute = function(url) {
	return ABS_URL.test(url);
};

var initOpenUI5 = function (files, ui5Config, basePath) {

	files.unshift({pattern: __dirname + '/autorun.js', included: true, served: true, watched: false});

	if (ui5Config.useMockServer) {
		files.unshift({pattern: __dirname + '/mockserver.js', included: true, served: true, watched: false});
	}
	var ui5path;
	if (isUrlAbsolute(ui5Config.path)) {
		ui5path = ui5Config.path;
	} else {
		ui5path = path.resolve(basePath, ui5Config.path);
	}
	files.unshift({pattern: ui5path, included: true, watched: false, served: true});
	files.unshift({pattern: __dirname + '/adapter.js', included: true, served: true, watched: false});
};

initOpenUI5.$inject = ['config.files', 'config.openui5', 'config.basePath'];

module.exports = {
	'framework:openui5': ['factory', initOpenUI5]
};
