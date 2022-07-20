import Storage, { ROOT } from './Storage.js'

const storage = new Storage()

const operations = [
  ['agent1', 1, [], ROOT, 'map', 'key', 'value1'],
  ['agent3', 2, [], ROOT, 'map', 'key', 'value3'],
  ['agent2', 3, [], ROOT, 'map', 'key', 'value2'],
]

storage.on('applylocal', (ops) => {
  console.log('Apply local', ops)
})

storage.applyOperations(operations, true)

console.log('Storage value', storage.value)
