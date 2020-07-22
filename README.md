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

### `watcher.watch(properties, callback)`

> watch properties with callback.

- `properties`: `string|string[]`
- `callback`:
  - `newVal`: `object`
  - `oldVal`: `object`
  - `trailingCommit`: `function`
  - `trailingCall`: `function`
  - => `trailingCallFunctions`: `void|function|function[]`


### `watcher.commit(propertiesValuesObject: object)`

> commit properties values.

- `propertiesValuesObject`: `object`

- commit properties in batch will benefit.


### `watcher.computed(computedProperty, dependentPropertyerties, callback)`

> define computed property.

- `computedProperty`: `string`
- `dependentPropertyerties`: `string[]`
- `callback`:
  - `latestValues`: `object`, old values merged with already computed values.
  - => `computedPropertyValue`: `any`

 - **callback only executes when dependent properties were committed in `commit`.**
 - **computed property is also normal property, when it was committed in `commit`, the computing function won't execute.**
 - **ordering of computed property defined is mattered.**


### `watcher.computing(dependentProperty, callback)`

> define computed properties triggered by only one property.

- `dependentProperty`: `string`
- `callback`:
  - `latestValues`: `object`, old values merged with already computed values.
  - => `computedPropertiesValuesObject`: `object`

### TEST

```shell
npm run test
```

### LICENSE

MIT
