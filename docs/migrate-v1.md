# Migrate to v1.0.0

## Breaking changes

### Rename from karma-openui5 to karma-ui5

The plugin has been renamed from `karma-openui5` to `karma-ui5`.

### No built-in MockServer support

The `useMockServer` option has been removed.  
A MockServer needs to be started from the test code.


## How to upgrade

### npm / package.json

The plugin has been renamed from `karma-openui5` to `karma-ui5`.  
Make sure to uninstall the old plugin and install the new one.

```sh
npm uninstall karma-openui5
npm install --save-dev karma-ui5
```

### General karma config

Rename the framework from `openui5` to `ui5`
```diff
 {
-  frameworks: ['openui5']
+  frameworks: ['ui5']
 }
```

Rename the `openui5` config to `ui5`
```diff
 {
-  openui5: {
+  ui5: {
     ...
   }
 }
```

Rename the `path` to `url` and remove `resources/sap-ui-core.js` at the end. The url should only point to the base path.
```diff
 {
   ui5: {
-     path: "https://example.com/resources/sap-ui-core.js"
+     url: "https://example.com"
   }
 }
```

### Mock Server

Remove the `useMockServer` config as it's not supported anymore. Instead make sure to start up the MockServer from your test code.

```diff
 {
   ui5: {
-     useMockServer: true
   }
 }
```

### Option 1 - Switch to the QUnit HTML Runner (recommended)

Using the new built-in QUnit HTML Runner makes most of the karma configuration obsolete and instead runs your existing QUnit Testsuites and Test Pages. This is the recommended way as it eases the configuration and uses the same setup as opening the HTML pages manually in the browser.

Remove the `client.openui5` configuration as it is not needed anymore
```diff
 {
   client: {
-    openui5: {
-      config: { ... },
-      tests: [ ... ],
-      mockserver: { ... }
-    }
   }
 }
```

The HTML Runner requires knownledge about the project type (application or library) which will be auto-detected in most common use cases.  
If this is not the case, you need to configure the project type and the paths to your entry folder(s).

Application
```diff
 {
   ui5: {
+    type: "application",
+    paths: {
+      webapp: "path/to/webapp"
+    }
   }
 }
```

Library
```diff
 {
   ui5: {
+    type: "library",
+    paths: {
+      src: "path/to/src"
+      test: "path/to/test"
+    }
   }
 }
```

In most cases the testsuite in your project can automatically be found and executed.
But in case your project contains multiple testsuites (testsuite.qunit.html), or does not contain a testsuite at all, you need to configure a testpage.
```diff
 {
   ui5: {
+    testpage: "webapp/test/MyTest.qunit.html"
   }
 }
```

### Option 2 -Keep using the script-based approach (advanced)

If you would like to keep using the script-based approach from v0.x, you need to move the `client.openui5` configuration to the new `ui5` section and disable the `htmlrunner`.

```diff
 {
   ui5: {
+    htmlrunner: false,
     url: "https://example.com",
+    config: { ... },
+    tests: [ ... ]
   },

   client: {
-    openui5: {
-      config: { ... },
-      tests: [ ... ]
-    }
   }

 }
```
