// const {ErrorMessage} = require("./errors");
const Framework = require("./framework");
const framework = new Framework();

async function init(config, logger) {
	await framework.init({config, logger});
}
init.$inject = ["config", "logger"];

module.exports = {
	"framework:ui5": ["factory", init],
	"middleware:ui5--beforeMiddleware": ["value", framework.beforeMiddleware],
	"middleware:ui5--middleware": ["value", framework.middleware]
};
