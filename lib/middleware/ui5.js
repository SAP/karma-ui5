/**
 * @param {object} options
 * @param {import('router')} options.middleware
 * @param {object} options.tree UI5 Project tree
 * @param {string} options.basePath karma config.basePath
 * @param {Promise} options.filesPromise karma filesPromise
 * @param {boolean} options.serveDependencies
 */
module.exports.initWithKarmaFiles = async function({middleware, tree, basePath, filesPromise, serveDependencies, log}) {
	const fsStat = require("util").promisify(require("fs").stat);
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

	const MiddlewareManager = require("@ui5/server/lib/middleware/MiddlewareManager");
	const middlewareManager = new MiddlewareManager({tree, resources});

	await middlewareManager.applyMiddleware(ui5MiddlewareRouter);

	let filesInitialized = false;
	middleware.use("/base/", async (req, res, next) => {
		// Use middleware to lazy initialize the rootProject files

		log.debug("initWithKarmaFiles (original): " + req.url);
		// TODO: similar to rewrite to virtual function (but without /base)
		req.url = req.url.replace(/^\/webapp/, "");
		log.debug("initWithKarmaFiles (rewrite): " + req.url);

		try {
			if (!filesInitialized) {
				const files = await filesPromise;
				const served = files.served.filter((file) => {
					return file.path.startsWith(tree.path);
				});
				await Promise.all(served.map(async (file) => {
					const resourcePath = file.path.replace(basePath, "").replace("/webapp/", "/");
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

			ui5MiddlewareRouter(req, res, next);
		} catch (err) {
			console.log(err);
			next(err);
		}
	});
};

module.exports.initWithoutKarmaFiles = async function(middleware, tree) {
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
