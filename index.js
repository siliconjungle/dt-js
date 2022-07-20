import Storage, { ROOT } from './Storage.js'

const storage = new Storage()

// [agent, seq, parents, crdtId, type, key, value]
const operations = [
  ['agent1', 1, [], ROOT, 'map', 'key', 'value1'],
  ['agent3', 2, [], ROOT, 'map', 'key', 'value3'],
  ['agent2', 3, [], ROOT, 'map', 'key', 'value2'],
]

storage.on('applylocal', (ops) => {
  console.log('applylocal', ops)
})

storage.applyOperations(operations, true)

console.log('_STORAGE_VALUE_', storage.value)
