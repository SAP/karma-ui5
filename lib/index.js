const Framework = require("./framework");
const framework = new Framework();

function init(config, logger) {
	framework.init({config, logger});
}

init.$inject = ["config", "logger"];

module.exports = {
	"framework:ui5": ["factory", init],
	"middleware:ui5--pauseRequests": ["factory", function() {
		return framework.pauseRequests();
	}],
	"middleware:ui5--serveResources": ["factory", function() {
		return framework.serveResources();
	}],
	"middleware:ui5--serveThemes": ["factory", function() {
		return framework.serveThemes();
	}]
};
