const watcher = require('./index')()
const assert = require('assert')

console.time('time')

let i = 0

function success() {
  assert.equal(i, 6)
}

function time() {
  console.timeEnd('time')
}

watcher.watch('a', function(newVal, oldVal, trailingCall, trailingCommit) {
  assert.equal(i++, 0)
  assert.equal(oldVal.a, undefined)
  assert.equal(newVal.a, 1)
  console.log('\t- trailing commit is applied after current commit done.')
  trailingCommit({ b: -1 })
})

watcher.watch('A', function(newVal, oldVal, trailingCall, trailingCommit) {
  assert.equal(i++, 1)
  console.log('\t- only watch properties are provided.')
  assert.equal(newVal.a, undefined)
  assert.equal(oldVal.a, undefined)
})

watcher.watch('b', function(newVal, oldVal, trailingCall, trailingCommit) {
  assert.equal(i++, 5)
  assert.equal(newVal.a, undefined)
  assert.equal(oldVal.a, undefined)
  assert.equal(watcher.get('a'), 1)
  assert.equal(newVal.c, undefined)
  assert.equal(oldVal.c, undefined)
  assert.equal(watcher.get('c'), -2)
  assert.equal(oldVal.b, undefined)
  assert.equal(newVal.b, -1)
  assert.equal(watcher.get('b'), -1)
  console.log('\t- only the last will be called in same trailing calls.')
  trailingCall(success, time)
  trailingCall(success)
  trailingCall(success)
  trailingCall(success)
  trailingCall(time)
})

watcher.computed('FailedDependentOnCBeforeC', ['c'], function(val) {
  i++
  return 'this has not been called, because c is computed and defined later.'
})

watcher.computed('c', ['b'], function(val) {
  assert.equal(i++, 2)
  return val.b * 2
})

watcher.computed('onlyCommitIsValidIfDefinedPreviously', ['SuccessDependentOnC'], function(val) {
  return 'SuccessDependentOnC is ' + val.SuccessDependentOnC
})

watcher.computed('SuccessDependentOnC', ['c'], function(val) {
  assert.equal(i++, 3)
  return 'c is ' + val.c
})

watcher.computing('c', function(val) {
  assert.equal(i++, 4)
  return {
    d: val.c * 10,
    e: val.c + 10
  }
})

watcher.commit({ a: 1, A: 'A' })

assert.equal(watcher.get('a'), 1)
assert.equal(watcher.get('A'), 'A')
assert.equal(watcher.get('b'), -1)
assert.equal(watcher.get('c'), -2)
console.log('\t- computed property is computed only when '
+ 'dependent properties changed by commit function directly or indirectly,'
+ 'so the ordering of computed property defined is mattered.')
assert.equal(watcher.get('FailedDependentOnCBeforeC'), undefined)
assert.equal(watcher.get('SuccessDependentOnC'), 'c is -2')
assert.equal(watcher.get('d'), -20)
assert.equal(watcher.get('e'), 8)

watcher.commit({ SuccessDependentOnC: true })

assert.equal(watcher.get('onlyCommitIsValidIfDefinedPreviously'), 'SuccessDependentOnC is true')
