module.exports.init = async function(middleware, tree, config, filesPromise, {serveDependencies}) {
	const ui5Fs = require("@ui5/fs");
	const Resource = ui5Fs.Resource;
	const resourceFactory = ui5Fs.resourceFactory;
	const ReaderCollectionPrioritized = ui5Fs.ReaderCollectionPrioritized;
	const MemoryAdapter = ui5Fs.adapters.Memory;

	const rootProject = new MemoryAdapter({virBasePath: "/"});

	let all;
	let dependencies;
	if (serveDependencies) {
		({dependencies} = resourceFactory.createCollectionsForTree(tree));
		all = new ReaderCollectionPrioritized({
			name: "server - prioritize workspace over dependencies",
			readers: [rootProject, dependencies]
		});
	} else {
		dependencies = new MemoryAdapter({virBasePath: "/"});
		// No need to create collection as no dependencies should be served
		all = rootProject;
	}

	const resources = {rootProject, dependencies, all};

	// TODO: rework ui5-server API and make public
	const Router = require("router");
	const ui5MiddlewareRouter = new Router();
	ui5MiddlewareRouter.use((req, res, next) => {
		// console.log("before ui5MiddlewareRouter: " + req.url);
		next();
	});
	const MiddlewareManager = require("@ui5/server/lib/middleware/MiddlewareManager");
	const middlewareManager = new MiddlewareManager({tree, resources});

	await middlewareManager.applyMiddleware(ui5MiddlewareRouter);

	ui5MiddlewareRouter.use((req, res, next) => {
		// console.log("after ui5MiddlewareRouter: " + req.url);
		next();
	});

	let filesInitialized = false;
	middleware.use("/base/webapp/", async (req, res, next) => {
		// Use middleware to lazy initialize the rootProject files
		try {
			if (!filesInitialized) {
				const files = await filesPromise;
				const served = files.served.filter((file) => {
					return file.path.startsWith(tree.path);
				});
				// console.log(served);
				await Promise.all(served.map(async (file) => {
					const resourcePath = file.path.replace(config.basePath, "").replace("/webapp/", "/");
					// console.log(resourcePath);
					const fsStat = require("util").promisify(require("fs").stat);
					const statInfo = await fsStat(file.path);
					const resource = new Resource({
						path: resourcePath,
						string: file.content,
						project: tree,
						statInfo
					});
					await rootProject.write(resource);
				}));
				filesInitialized = true;
			}

			// console.log("Calling ui5middleware: " + req.url);
			ui5MiddlewareRouter(req, res, next);
		} catch (err) {
			console.log(err);
			next(err);
		}
	});
};

module.exports.init2 = async function(middleware, tree) {
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
