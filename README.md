# commit

> Watching and commit values in batch.

## Usage

Read more in [test.js](./test.js)

```js
const watcher = require('commit')()
```

### trailing callback

All unique trailing call functions are called only once in order at the end(after watch, computed, and computing callbacks) of current commit cycle. In other words, if there are functions are equal(`===`) to each other, only th last one added will execute.

### trailing commit

All trailing committed data will be merged and committed at the most end(after trailing callback) of commit cycle.

## API

### `watcher.watch(properties: string|string[], callback: (newVal: object, oldVal: object, trailingCommit: function, trailingCall: function) => trailingCallFunctions: void|function|function[])`

> watch properties with callback.


### `watcher.commit(propertiesValuesObject: object)`

> commit properties values.

- commit properties in batch will benefit.


### `watcher.computed(computedProperty: string, dependentPropertyerties: string[], callback: (latestValues: object) => computedPropertyValue: any)`

> define computed property.

 - **callback only executes when dependent properties were committed in `commit`.**
 - **computed property is also normal property, when it was committed in `commit`, the computing function won't execute.**


### `watcher.computing(dependentProperty: string, callback: (latestValues: object) => computedPropertyertiesValuesObject: object)`

> define computed properties triggered by only one property.

### TEST

```shell
npm run test
```

### LICENSE

MIT
