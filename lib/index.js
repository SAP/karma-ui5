// const {ErrorMessage} = require("./errors");
const Framework = require("./framework");
const Middleware = require("./middleware");

const framework = new Framework();
const middleware = new Middleware();

function init(config, logger) {
	framework.init({config, logger});
	middleware.init({config, logger});
}
init.$inject = ["config", "logger"];

module.exports = {
	"framework:ui5": ["factory", init],
	"middleware:ui5--beforeMiddleware": ["factory", function() {
		return middleware.beforeMiddleware();
	}],
	"middleware:ui5--middleware": ["factory", function() {
		return middleware.middleware();
	}]
};
