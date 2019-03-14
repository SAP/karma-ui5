![UI5 icon](https://raw.githubusercontent.com/SAP/ui5-tooling/master/docs/images/UI5_logo_wide.png)

[![NPM Version](http://img.shields.io/npm/v/karma-ui5.svg?style=flat)](https://www.npmjs.org/package/karma-ui5)

**Table of Contents**

- [About](#about)
  - [Installation](#installation)
  - [Configuration](#configuration)
    - [Project Types](#project-types)
    - [Custom paths](#custom-paths)
    - [UI5 URL](#ui5-url)
    - [UI5 Tooling Middleware](#ui5-tooling-middleware)
    - [Defining Testpage](#defining-testpage)
  - [Advanced usage](#advanced-usage)
    - [Configuration](#configuration-1)
      - [Bootstrap](#bootstrap)
      - [Tests](#tests)
  - [Application constrains](#application-constrains)
    - [QUnit dependency](#qunit-dependency)
    - [OPA5: Component containers instead of iFrames](#opa5-component-containers-instead-of-iframes)
  - [License](#license)

# About
Adapter for UI5. This adapter loads UI5 from the specified location and makes it available for the tests to run in karma afterwards.

**Note: :warning: This document describes the upcoming version 1.0.0, which is not released, yet.  
The current documentation can be found on the [0.x branch](https://github.com/SAP/karma-ui5/tree/0.x#readme).**

## Installation
The easiest way is to add `karma-ui5` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "karma-ui5": "^1.0.0"
  }
}
```

Information on how to install `karma` can be found [here.](https://karma-runner.github.io/latest/index.html)

## Configuration

### Project Types

UI5 supports 2 different module types: application and library. The type can be defined using the type property

```javascript
// karma.conf.js
{
  "ui5": {
    "type": "application"
  }
}
```

The plugin discovers the type automatically in case if no type was entered in the config. Here it is important to follow the UI5 folder naming convention.

* webapp for appplications
* src and test for libraries

### Custom paths

By default the folder names must follow the UI5 naming convention, therefore using different folder names and location will lead to malfunction. In this case it is possible to overwrite the default folder paths using the paths property.

**Application**
```javascript
"ui5": {
  "type": "application",
  "paths": {
    "webapp": "custompath/to/application"
  }
}
```

**Library**
```javascript
"ui5": {
  "type": "library",
  "paths": {
    "src": "custompath/to/src",
    "test": "custompath/to/test"
  }
}
```

> Note: the module type needs to be defined manually in this case.

### UI5 URL
By specifying an URL it is possible to serve UI5 resources from a specific destination.

```json
"ui5": {
  "url": "https://openui5nightly.hana.ondemand.com"
}
```

It is also possible to set the url directly from the CLI. This can for example be used to test against different UI5 versions.

```shell
karma start --ui5-url="https://openui5nightly.hana.ondemand.com"
```

### UI5 Tooling Middleware

When using the [UI5 Tooling](https://github.com/SAP/ui5-tooling) you can also omit specifying an URL to use the local dependencies (e.g. via npm).
The plugin automatically injects the server middleware into karma, so no additional local server is required.


### Defining Testpage

During the startup a search for testsuite.qunit.html files inside one of the project subfolders is executed. It is also possible to explicitly define the testpage via karma.conf.js

```javascript
{
  ui5: {
    testpage: "path/to/your/testsuite.qunit.html"
  }
}
```

or the cli

```shell
karma start karma.conf.js --ui5-testpage="path/to/your/testsuite.qunit.html"
```

## Advanced usage

The plugin by default searches for html files (testsuite.html) for execution. In case if the testrunner shouldn't be used it is required to set the **htmlrunner** property.

```javascript
{
  "ui5": {
    "htmlrunner": false
  }
}
```

### Configuration

For the client UI5 configuration you can create an object using any of the options described in the
[documentation](https://openui5.hana.ondemand.com/#/topic/91f2d03b6f4d1014b6dd926db0e91070.html).

#### Bootstrap
In case if htmlrunner is not used, it is also important to set the bootstrap via configuration instead of directly inside the index.html. For example:

```javascript
"ui5": {
  "config": {
    "theme": 'sap_belize',
    "language": 'EN',
    "bindingSyntax": 'complex',
    "compatVersion": 'edge',
    "async": true,
    "resourceroots": {'test.app': './base/webapp'}
  }
}
```

#### Tests
To automatically load test modules (via `sap.ui.require`), the `tests` config can be set to an array of module names e.g.

```javascript
// karma.conf.js
"tests": [ 'test/app/test/test.qunit' ]
```

> Note: Please note that it the resourceroots need to be defined for proper file system mappings.

## Application constrains
### QUnit dependency
Do no require QUnit resources from within the tests. Karma loads its own versions of them in order hook in its reporting at the right places.

Therefore rather load those resources in the non-karma specific test runner HTML pages. Like this:
````html
    <script src="../../resources/sap/ui/thirdparty/qunit.js"></script>
    <script src="../../resources/sap/ui/qunit/qunit-css.js"></script>
````

### OPA5: Component containers instead of iFrames
*Only relevant when using [Istanbul](https://istanbul.js.org/) to create test coverage*

[Istanbul](https://istanbul.js.org/) has problems collecting code coverage results from within iFrames. To gather code coverage from OPA5 tests you need to execute them inside of component containers instead of iFrames. This will also speed up the execution time of your OPA5 tests.

**Notice:** With component containers you will loose the isolation of your single tests. Also, your applications `index.html` won't be executed anymore (as only the applications `Component.js` will be needed).

In your tests, replace `iStartMyAppInAFrame()` with`iStartMyUIComponent()` and `iTeardownMyAppFrame()` with `iTeardownMyUIComponent()`.

For more information see the API reference of [sap.ui.test.Opa5](https://sapui5.hana.ondemand.com/#docs/api/symbols/sap.ui.test.Opa5.html#iStartMyUIComponent)

## License
(c) Copyright 2019 SAP SE or an SAP affiliate company

Licensed under the Apache License, Version 2.0 - see LICENSE.
