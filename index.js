/**
 * @callback watcherCallback
 * @param {object} newVal latest values(applied current commit and computing) of current watcher function bound properties.
 * @param {object} oldVal old values of current watcher function bound properties before current commit .
 * @param {function} trailingCall add trailing functions,
 *  which all will be executed after current tick(commit),
 *  also, only the last one in same trailing functions will be executed.
 * @param {function} trailingCommit add data for trailing commit,
 *  data will commit after current tick(commit).
 * @returns {undefined|function|function[]} trailing functions
 */

/**
 * @callback trailingCall
 * @param {...function}
 */

/**
 * @callback trailingCommit
 * @param {object}
 */

/**
 *  1. watch in batch.
 *  2. commit in batch.
 *  3. only call once watcher callback when multiple relative values changed.
 *  4. watcher callback support trailing commit and trailing callback, to commit change once in a same tick.
 *
 * @example
 *  function trace() {
 *    console.log('commit. only called once')
 *  }
 *  watch(['width', 'height'], function(newVal, { oldVal, trailingCall, trailingCommit }) {
 *    console.log(newVal.width, newVal.height) // 10, 10
 *    trailingCall(trace)
 *  })
 *  watch('width', function() {
 *    console.log(newVal.width, newVal.height) // 10, undefined
 *    trailingCall([trace])
 *  })
 *  commit({
 *    width: 10,
 *    height: 10,
 *  })
 */
class Watcher {
  constructor() {
    this._id = 0
    this.watchers = new Map()
    this.dispatchers = new Map()
    this.values = new Map()
    this.computations = new Set()
  }
  _map2obj(map) {
    const obj = {}
    for (const [key, val] of map) obj[key] = val
    return obj
  }
  /**
   *
   * @param {object} data raw data provided by `commit`.
   */
  _compute(data) {
    data = Object.assign({}, data)
    const values = Object.assign(this._map2obj(this.values), data)
    const computed = {}
    for (const e of this.computations) {
      if (e.type === 'from') {
        // skip computing when computed property has been committed proactively.
        if (e.computedProp in data) continue
        // only computing when dependent properties values were committed or computed, and changed(!==).
        for (const prop of e.props) {
          if (prop in data && this.values.get(prop) !== data[prop]) {
            computed[e.computedProp] = e.compute(values)
            // computed property is also regarded as triggering property.
            Object.assign(data, computed)
            Object.assign(values, data)
          }
        }
      } else if (e.type === 'to') {
        if (e.triggeringProp in data && data[e.triggeringProp] !== this.values.get(e.triggeringProp)) {
          const r = e.compute(values)
          if (r) {
            Object.assign(computed, r)
            Object.assign(data, computed)
            Object.assign(values, data)
          }
        }
      }
    }
    return computed
  }
  /**
   * add computed property.
   * !!! only computed when dependent properties were committed in `commit`.
   * !!! computed property is also normal property, when it was committed in `commit`, the computing function will not execute.
   * @param {string} computedProp computed property name
   * @param {string[]} props dependent properties.
   * @param {function} compute return computed property value, only executed when `props` were committed in `commit`.
   */
  computed(computedProp, props, compute) {
    for (const e of this.computations)
      if (e.type === 'from' && e.computedProp === computedProp)
        this.computations.delete(e)
    this.computations.add({type: 'from', computedProp, props, compute})
  }
  /**
   * add computed properties triggered by only one property.
   * @param {string} triggeringProp dependent property.
   * @param {function} compute return computed property value, only executed when `triggeringProp` was committed in `commit`.
   */
  computing(triggeringProp, compute) {
    for (const e of this.computations)
      if (e.type === 'to' && e.triggeringProp === triggeringProp)
        this.computations.delete(e)
    this.computations.add({type: 'to', triggeringProp, compute})
  }
  /**
   * commit data in once.
   * @param {object|function} data
   */
  commit(data) {
    if (typeof data === 'function')
      data = data(this.values)
    if (!data || !Object.keys(data).length)
      return this
    data = Object.assign({}, data, this._compute(data))
    const dispatches = new Map()
    const oldValues = new Map()
    for (const key of Object.keys(data)) {
      const oldVal = this.values.get(key)
      const newVal = data[key]
      if (oldVal !== newVal) {
        oldValues.set(key, oldVal)
        this.values.set(key, newVal)
        if (this.dispatchers.has(key)) {
          const dispatchers = this.dispatchers.get(key)
          for (const dispatcher of dispatchers) {
            const e = dispatches.get(dispatcher)
            if (e)
              e[key] = newVal
            else
              dispatches.set(dispatcher, { [key]: newVal })
          }
        }
      }
    }
    const trailingCommitter = {}
    const trailingCalls = []
    const trailingCommit = Object.assign.bind(Object, trailingCommitter)
    const trailingCall = trailingCalls.push.bind(trailingCalls)
    for (const e of dispatches) {
      const [dispatch, props] = this.watchers.get(e[0])
      if (dispatch) {
        const newVal = {}
        const oldVal = {}
        for (const prop of props) {
          if (prop in e[1]) {
            newVal[prop] = e[1][prop]
            oldVal[prop] = oldValues.get(prop)
          } else {
            newVal[prop] = oldVal[prop] = this.values.get(prop)
          }
        }
        const calls = dispatch(newVal, oldVal, trailingCall, trailingCommit)
        if (calls)
          Array.isArray(calls) ? trailingCall(...calls) : trailingCall(calls)
      }
    }
    // execute the last one of same trailing functions.
    trailingCalls.forEach((call, i) => call && i === trailingCalls.lastIndexOf(call) && call())
    this.commit(trailingCommitter)
    trailingCalls.length = 0
    return this
  }
  /**
   * watch properties with callback.
   * @param {string|string[]} props
   * @param {watcherCallback} dispatch
   */
  watch(props, dispatch) {
    if (!Array.isArray(props)) props = [props]
    this.watchers.set(++this._id, [dispatch, props])
    props.forEach(prop => {
      let dispatcher = this.dispatchers.get(prop)
      if (!dispatcher) {
        dispatcher = []
        this.dispatchers.set(prop, dispatcher)
      }
      dispatcher.push(this._id)
    })
    return this
  }
  /**
   * get property value in commit pool.
   * @param {string} key
   */
  get(key) {
    return this.values.get(key)
  }
}

module.exports = () => new Watcher()
