![OpenUI5](http://openui5.org/images/OpenUI5_new_big_side.png)

[![NPM Version](http://img.shields.io/npm/v/karma-openui5.svg?style=flat)](https://www.npmjs.org/package/karma-openui5)

# karma-openui5
Adapter for OpenUI5/SAPUI5 UI framework. This adapter loads OpenUI5/SAPUI5 from the specified location and makes it available for the tests to run in karma afterwards.

## Installation
The easiest way is to add `karma-openui5` as a devDependency in your `package.json`.
```json
{
  "devDependencies": {
    "karma-openui5": "~0.2"
  }
}
```

Information on how to install `karma` can be found [here.](https://karma-runner.github.io/1.0/intro/installation.html)

## Configuration
The following code shows the available configuration options.

For the client OpenUI5 configuration you can create an object using any of the options described in the
[documentation](https://openui5.hana.ondemand.com/docs/guide/91f2d03b6f4d1014b6dd926db0e91070.html).

For the mockserver config you can pass an object like you would do it for the ``sap.ui.core.util.MockServer.config``
function. The rootUri and the metadataURL are required properties if you use the mock server. You can also pass
mockdata settings like you would do it for the ``simulate`` function of the MockServer. The MockServer needs to be
enabled explicitly by settings the ``useMockServer`` option.

```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['openui5'],

    openui5: {
      path: 'http://path/to/sap-ui-core.js',
      useMockServer: false
    },

    client: {
      openui5: {
        config: {
          theme: 'sap_belize'
        },
        mockserver: {
          config: {
            autoRespond: true
          },
          rootUri: '/my/service/',
          metadataURL: '/base/test/mock.xml',
          mockdataSettings: {

          }
        }
      }
    }
  });
};
```

## Application constrains
### QUnit dependency
Do no require QUnit resources from within the tests. Karma loads its own versions of them in order hook in its reporting at the right places.

Therefore rather load those resources in the non-karma specific test runner HTML pages. Like this:
````html
    <script src="../../resources/sap/ui/thirdparty/qunit.js"></script>
    <script src="../../resources/sap/ui/qunit/qunit-css.js"></script>
````

### Delaying Karma start
Karma loads all given files via script tags. It expects them to register all tests synchronously so that it can start the execution right away.

When using asynchronous preloads or the AMD syntax `sap.ui.define` or `sap.ui.require`, the Karma test execution needs to be delayed.

We therefore have an additional file exclusively for Karma, loading all our tests and postponing the execution until everything is ready:
````javascript
(function (karma) {
    "use strict";

    // Prevent Karma from running prematurely.
    karma.loaded = function () {};

    sap.ui.getCore().attachInit(function() {
        sap.ui.require([
            "sap/ui/demo/todo/test/unit/allTests",
            "sap/ui/demo/todo/test/integration/AllJourneys"
        ], function() {
            // Finally, start Karma to run the tests.
            karma.start();
        });
    });
})(window.__karma__)
````

### OPA5: Component containers instead of iFrames
*Only relevant when using [Istanbul](https://istanbul.js.org/) to create test coverage*

[Istanbul](https://istanbul.js.org/) has problems collecting code coverage results from within iFrames. To gather code coverage from OPA5 tests you need to execute them inside of component containers instead of iFrames. This will also speed up the execution time of your OPA5 tests.

**Notice:** With component containers you will loose the isolation of your single tests. Also, your applications `index.html` won't be executed anymore (as only the applications `Component.js` will be needed).

In your tests, replace `iStartMyAppInAFrame()` with`iStartMyUIComponent()` and `iTeardownMyAppFrame()` with `iTeardownMyUIComponent()`.

For more information see the API reference of [sap.ui.test.Opa5](https://sapui5.hana.ondemand.com/#docs/api/symbols/sap.ui.test.Opa5.html#iStartMyUIComponent)

## License
(c) Copyright 2017 SAP SE or an SAP affiliate company

Licensed under the Apache License, Version 2.0 - see LICENSE.
