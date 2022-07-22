import Storage, { ROOT } from './Storage.js'

const storage = new Storage()

storage.applyLocalOperation(['seph', 0], ROOT, 'map',
  {key: 'yo', primitive: 123}
)

// const inner = storage.applyLocalOperation(['seph', 0], ROOT, 'map',
//   {key: 'hey', embeddedType: 'map'}
// )

// storage.applyLocalOperation(['seph', 1], inner, 'map',
//   {key: 'yo', primitive: 123}
// )

// const inner = storage.applyRemoteOperation({
//   agent: 'seph', seq: 0, parents: [],
//   crdtId: ROOT, type: 'map', key: 'yo',
//   // primitive: 123,
//   embeddedType: 'map'
// }, true)

// storage.applyRemoteOperation({
//   agent: 'seph', seq: 1, parents: [inner],
//   crdtId: inner, type: 'map', key: 'hey',
//   primitive: 123,
//   // embeddedType: 'map'
// }, true)

// const operations = [
//   ['agent1', 1, [], ROOT, 'map', 'key', 'value1'],
//   ['agent3', 2, [], ROOT, 'map', 'key', 'value3'],
//   ['agent2', 3, [], ROOT, 'map', 'key', 'value2'],
// ]

// storage.on('applylocal', (ops) => {
//   console.log('Apply local', ops)
// })

// storage.applyOperations(operations, true)

console.log('Storage value', storage.value)
// console.log('version', storage.causalGraph.version)
