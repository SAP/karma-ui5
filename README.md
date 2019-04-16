![UI5 icon](https://raw.githubusercontent.com/SAP/ui5-tooling/master/docs/images/UI5_logo_wide.png)

[![NPM Version](https://img.shields.io/npm/v/karma-ui5.svg?style=flat)](https://www.npmjs.org/package/karma-ui5)

**Table of Contents**
- [About](#about)
- [Quickstart](#quickstart)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Execution](#execution)
- [Karma configuration requirements](#karma-configuration-requirements)
- [Options](#options)
  - [url](#url)
  - [type](#type)
  - [paths](#paths)
  - [mode](#mode)
    - [html](#html)
    - [script](#script)
  - [testpage](#testpage)
  - [config](#config)
  - [tests](#tests)
- [License](#license)


## About
This Karma plugin helps testing your UI5 projects.

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

## License
(c) Copyright 2019 SAP SE or an SAP affiliate company

Licensed under the Apache License, Version 2.0 - see LICENSE.
