module.exports.init = async function(middleware, tree) {
	const ui5Fs = require("@ui5/fs");
	const resourceFactory = ui5Fs.resourceFactory;
	const ReaderCollectionPrioritized = ui5Fs.ReaderCollectionPrioritized;

	const projectResourceCollections = resourceFactory.createCollectionsForTree(tree);

	const workspace = resourceFactory.createWorkspace({
		reader: projectResourceCollections.source,
		name: tree.metadata.name
	});

	const all = new ReaderCollectionPrioritized({
		name: "server - prioritize workspace over dependencies",
		readers: [workspace, projectResourceCollections.dependencies]
	});

	const resources = {
		rootProject: projectResourceCollections.source,
		dependencies: projectResourceCollections.dependencies,
		all
	};

	// TODO: rework ui5-server API and make public
	const MiddlewareManager = require("@ui5/server/lib/middleware/MiddlewareManager");
	const middlewareManager = new MiddlewareManager({
		tree,
		resources
	});

	await middlewareManager.applyMiddleware(middleware);
};
