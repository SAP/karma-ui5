![UI5 icon](https://raw.githubusercontent.com/SAP/ui5-tooling/master/docs/images/UI5_logo_wide.png)

[![REUSE status](https://api.reuse.software/badge/github.com/SAP/karma-ui5)](https://api.reuse.software/info/github.com/SAP/karma-ui5)
[![NPM Version](https://img.shields.io/npm/v/karma-ui5.svg?style=flat)](https://www.npmjs.org/package/karma-ui5)

**Table of Contents**
- [About](#about)
- [Quickstart](#quickstart)
	- [Installation](#installation)
	- [Configuration](#configuration)
		- [Script Mode](#script-mode)
	- [Execution](#execution)
- [Karma Configuration Requirements](#karma-configuration-requirements)
- [Options](#options)
	- [url](#url)
	- [type](#type)
	- [paths](#paths)
	- [configPath](#configpath)
	- [mode](#mode)
		- [html](#html)
		- [script](#script)
	- [testpage](#testpage)
	- [urlParameters](#urlparameters)
	- [failOnEmptyTestPage](#failonemptytestpage)
	- [config](#config)
	- [tests](#tests)
	- [fileExport](#fileexport)
- [API](#api)
	- [helper](#helper)
		- [configureIframeCoverage](#configureiframecoverage)
- [License](#license)


## About
This Karma plugin helps testing your UI5 projects.

Please refer to the [Testing](https://openui5.hana.ondemand.com/#/topic/7cdee404cac441888539ed7bfe076e57) section in the UI5 Developer Guide for information about writing tests for your project.

**Note:** This project has been renamed from `karma-openui5` to `karma-ui5` with the v1.0.0 release.  
For upgrade information, see the [Migration Guide](./docs/migrate-v1.md).  
For the `karma-openui5` documentation, see [0.x branch](https://github.com/SAP/karma-ui5/tree/0.x#readme).


## Quickstart

### Installation

First you need to install the Karma CLI globally:

```shell
npm install -g karma-cli
```

You can find more information on installing Karma [here](https://karma-runner.github.io/latest/intro/installation.html).

Next, you need to add `karma` and `karma-ui5` as devDependencies:

```shell
npm install --save-dev karma karma-ui5
```

To start a browser, you also need to install a launcher, e.g. for Chrome:

```shell
npm install --save-dev karma-chrome-launcher
```

### Configuration

To configure the plugin, you need to add two things to your `karma.conf.js`:
1. Specify `"ui5"` in the list of `frameworks`.
1. Set a URL for serving the UI5 resources.
   - **Note:** This can be omitted when you use [UI5 Tooling](#url).

This is an example `karma.conf.js` file that is sufficient for most projects:

```js
module.exports = function(config) {
  config.set({

    frameworks: ["ui5"],

    ui5: {
      url: "https://openui5.hana.ondemand.com"
    },

    browsers: ["Chrome"]

  });
};
```

#### Script Mode

*(Optional, next step: [Execution](#execution))*

The configuration above implies to use the [`html` mode](#html), which is recommended.
It runs your existing test pages and does not require additional Karma plugins or configuration.

However the [`script` mode](#script) is more flexible and better allows integration with other karma plugins / frameworks.

The following steps describe a minimal configuration for the `script` mode.

With the `script` mode you need to also include a testing framework and its Karma adapter, like [QUnit](https://qunitjs.com/) and [karma-qunit](https://github.com/karma-runner/karma-qunit).
```shell
npm install --save-dev qunit karma-qunit
```

To use test spies, stubs and mocks you need to install [Sinon.JS](https://sinonjs.org/) and [karma-sinon](https://github.com/yanoosh/karma-sinon).
```shell
npm install --save-dev sinon karma-sinon
```

Both frameworks need to be added to the `karma.conf.js`.  
Note that `ui5` should be the first entry.
```js
frameworks: ["ui5", "qunit", "sinon"]
```

Next, you need to provide the UI5 bootstrap configuration (see [config](#config)).  
The `resourceRoots` configuration should be aligned with your project namespace.
```js
ui5: {
  config: {
    async: true,
    resourceRoots: {
      "sap.ui.demo.todo": "./base/webapp"
    }
  }
}
```

Last but not least the test modules need to be listed, so that they are executed.
```js
ui5: {
  tests: [
    "sap/ui/demo/todo/test/unit/AllTests"
  ]
}
```

Here is the full example for the `script` mode:
```js
module.exports = function(config) {
  config.set({
    frameworks: ["ui5", "qunit", "sinon"],
    ui5: {
      url: "https://openui5.hana.ondemand.com",
      mode: "script",
      config: {
        async: true,
        resourceRoots: {
          "sap.ui.demo.todo": "./base/webapp"
        }
      },
      tests: [
        "sap/ui/demo/todo/test/unit/AllTests"
      ]
    },
    browsers: ["Chrome"]
  });
};
```

### Execution

With the above configuration, karma will by default run all tests in Chrome and listen for changed files to execute them again (watch mode).

```sh
karma start
```

For CI testing, you can run Chrome in headless mode and execute the tests only once using the `singleRun` option:

```js
module.exports = function(config) {
  config.set({

    // ...

    browsers: ["ChromeHeadless"],
    singleRun: true

  });
};
```

The options can also be set via CLI arguments:

```sh
karma start --browsers=ChromeHeadless --singleRun=true
```

For more information, see the ["Configuration File" documentation from Karma](https://karma-runner.github.io/latest/config/configuration-file.html).

## Karma Configuration Requirements

There is an important requirement for using this plugin:

- The karma `basePath` option **must point to your project root, not to a subfolder** like "webapp". This is the default when your `karma.conf.js` is in the project root.  
It is required for the [type detection](#type) and automatic inclusion of your project files.

## Options

All configuration options need to be defined in an `ui5` object in your Karma configuration:

```js
module.exports = function(config) {
  config.set({

    ui5: {

    }

  });
};
```

### url
Type: `string`  
CLI: `--ui5.url`

The URL where UI5 should be loaded from.

When omitted and the project contains a `ui5.yaml` file, [UI5 Tooling](https://github.com/SAP/ui5-tooling) will be used as server middleware.

Example:
```js
ui5: {
  url: "https://openui5.hana.ondemand.com"
}
```

### type
Type: `enum` (`"application"` / `"library"`)  

Defines the [project type](https://github.com/SAP/ui5-builder#types).  
If not set, it is automatically detected based on
- the type defined in `ui5.yaml`, or
- existing folders
  - "webapp" => `application`
  - "src" / "test" => `library`

Example:

```js
ui5: {
  type: "application"
}
```

### paths
Type: `object`

Custom path mappings for project folders based on the `type`.  
Use this option only when the automatic type detection does not work because the project uses a different folder structure.

Example `application`:
```js
ui5: {
  type: "application",
  paths: {
    webapp: "src/main/webapp"
  }
}
```

Example `library`:
```js
ui5: {
  type: "library",
  paths: {
    src: "src/main/js",
    test: "src/test/js"
  }
}
```

### configPath
Type: `string`  
Default: `"ui5.yaml"`  
CLI: `--ui5.configPath`

Path to the UI5 configuration file.
It is resolved relative to the project root.

Example:
```js
ui5: {
  configPath: "ui5-test.yaml"
}
```

### mode
Type: `enum` (`"html"` / `"script"`)  
Default: `"html"`

Configures the mode how tests should be executed.

#### html

The HTML mode runs QUnit test suites and test pages in a separate context.  
It has built-in support for QUnit. The [QUnit adapter](https://github.com/karma-runner/karma-qunit) **must not be used** in combination with this mode. Other framework plugins must also **not** be used. Instead, the required libraries such as sinon should be loaded within the test.

```js
ui5: {
  mode: "html"
}
```

Specific config options:
- [testpage](#testpage)
- [urlParameters](#urlParameters)
- [failOnEmptyTestPage](#failonemptytestpage)

#### script

The script mode includes the UI5 bootstrap script. It allows to pass UI5 config and loads your test modules.  
You need to also install and configure an adapter for your test framework such as [QUnit](https://github.com/karma-runner/karma-qunit), to enable test execution and reporting.

```js
ui5: {
  mode: "script"
}
```

Specific config options:
- [config](#config)
- [tests](#tests)

### testpage
Type: `string`  
CLI: `--ui5.testpage`  
Specific to ["html" mode](#html)

A file path pointing to a test page or test suite that should be executed.  
The path needs to be relative to the project root.

If not set, the project is scanned for available test suites (`testsuite.qunit.html`).  
When exactly one test suite is found, it will be used as `testpage`. Otherwise, all found pages are printed out and one of them needs to be configured manually.

Example:
```js
ui5: {
  mode: "html",
  testpage: "webapp/test/myTestPage.qunit.html"
}
```

### urlParameters
Type: `Array`  
Specific to ["html" mode](#html)

URL parameters to append to every testpage.

Example:
```js
ui5: {
    mode: "html",
    urlParameters: [{
        key: "hidepassed",
        value: true
    }]
}
```

### failOnEmptyTestPage
Type: `boolean`  
Default: `false`  
CLI: `--ui5.failOnEmptyTestPage`  
Specific to ["html" mode](#html)

Reports an error when a test page does not define any tests.  
The [Karma configuration `failOnEmptyTestSuite`](https://karma-runner.github.io/latest/config/configuration-file.html) only covers the case when no tests were defined at all, but not when just one testpage doesn't define tests.

Example:
```js
ui5: {
		mode: "html",
		failOnEmptyTestPage: true
}
```

### config
Type: `object`  
Specific to ["script" mode](#script)

Configuration of the [UI5 bootstrap](https://openui5.hana.ondemand.com/#/topic/91f2d03b6f4d1014b6dd926db0e91070.html).

Example:
```js
ui5: {
  mode: "script",
  config: {
    bindingSyntax: "complex",
    compatVersion: "edge",
    async: true,
    resourceRoots: {
      "sap.ui.demo.todo": "./base/webapp"
    }
  }
}
```

### tests
Type: `Array`  
Specific to ["script" mode](#script)

List of test modules that should be loaded (via `sap.ui.require`).  
If not provided, the test files must be included in the [karma `files` config](https://karma-runner.github.io/latest/config/files.html) to load them with &lt;script&gt; tags.

Example:
```js
ui5: {
  mode: "script",
  tests: [
    "sap/ui/demo/todo/test/unit/AllTests",
    "sap/ui/demo/todo/test/integration/AllJourneys"
  ]
}
```

### fileExport
Type: `boolean` or `object`  
Default: `false`

Configures whether report files provided by tools like UI5 Support Assistant are exported to the file system.  
Optionally, an output directory can be set to specify the export path.

Example `boolean`:
```js
ui5: {
  fileExport: true
}
```

Example `object`:
```js
ui5: {
  fileExport: {
    outputDir: "directory/to/export/files"
  }
}
```

Projects can also add report files by themselves by setting or enhancing the global `window._$files` array in the executed source code in the following way:
```js
window._$files = window._$files || [];
window._$files.push({
  name: "file_name.txt",
  content: "file content"
});
```

## API

### helper

This plugin also comes with a helper module to be used in your Karma configuration file.

#### configureIframeCoverage

Enables code coverage for iframes.
Can only be used in combination with the [karma-coverage](https://github.com/karma-runner/karma-coverage) plugin (v2.0.0+).

Must be called from the karma configuration function after the coverage plugin has been configured.
The `config` object must be passed as a parameter.

```js
module.exports = function(config) {
	config.set({

		// ...

	});
	require("karma-ui5/helper").configureIframeCoverage(config);
};
```

## Big Thanks

Cross-browser Testing Platform and Open Source <3 Provided by [Sauce Labs](https://saucelabs.com).

<img width="200px" alt="Testing Provided by Sauce Labs" src="./resources/saucelabs.svg">
