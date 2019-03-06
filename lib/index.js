const Framework = require("./framework");
const framework = new Framework();

function init(config) {
	framework.init(config);
}

init.$inject = ["config"];

module.exports = {
	"framework:qunit-html": ["factory", init],
	"middleware:qunit-html--pauseRequests": ["factory", function() { return framework.pauseRequests() } ],
	"middleware:qunit-html--serveResources": ["factory", function() { return framework.serveResources() } ],
	"middleware:qunit-html--serveThemes": ["factory", function() { return framework.serveThemes() } ]
};
