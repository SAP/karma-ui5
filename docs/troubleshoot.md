# Troubleshooting Guide

## Problems and solutions

```diff 
- Error: Could not parse ui5.yaml 
```

This error is caused if the type has not been defined in the karma.config
In this case the plugin automatically tries to detect the type defined in ui5.yaml. The error is shown if the ui5.yaml is not well formed.

For more details: [README](https://github.com/SAP/karma-ui5/blob/logging_improvement/README.md#project-types) 

```diff 
- Error: Failed to rewrite url. Type is not supported! 
```

The karma plugin currently supports 2 project types: application and library. Therefore the project must contain a valid ui5.yaml, otherwise the type must be defined in the karma.conf.js

```js
ui5: {
	type: "application"
}
```

For more details: [instructions](https://github.com/SAP/karma-ui5/blob/logging_improvement/README.md#project-types)


```diff
- Error: Could not find a testsuite or no testpage defined
```

This error occur if testsuites.qunit.html files couldn't be found or if no testpages have been defined. The issue can be fixed be setting testpage property via config or url. For more details: [README](https://github.com/SAP/karma-ui5/blob/logging_improvement/README.md#defining-testpage).

