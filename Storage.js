import EventEmitter from 'events'
import assert from 'assert/strict'
import Map2 from 'map2'

export const ROOT = ['ROOT', 0]

// version = [agent, seq]

const versionEq = ([a1, s1], [a2, s2]) => (a1 === a2 && s1 === s2)
const versionCmp = ([a1, s1], [a2, s2]) => (
  a1 < a2 ? 1
    : a1 > a2 ? -1
    : s1 - s2
)

// frontier is a list of versions
export const advanceFrontier = (frontier, version, parents) => {
  const f = frontier.filter(v => !parents.some(v2 => versionEq(v, v2)))
  f.push(version)
  return f.sort(versionCmp)
}

export const advanceRegister = (pairs, version, value, parents) => {
  const f = pairs.filter(([v]) => !parents.some(v2 => versionEq(v, v2)))
  f.push([version, value])
  return f.sort(([v1], [v2]) => versionCmp(v1, v2))
}

class Storage extends EventEmitter {
  constructor() {
    super()
    // this.causalGraph = causalGraph.create()
    // Map from CRDT id to CRDT value

    this.version = []

    this.value = {}
    this.crdts = new Map2() // (agent, seq) -> inner CRDT
    this.crdts.set(ROOT[0], ROOT[1], {
      type: 'map',
      registers: {}, // key -> [[version, value]] pairs
      value: this.value,
    })

    this.bufferedOps = []
    this.flushQueued = false
  }

  flushSoon() {
    if (!this.flushQueued) {
      setTimeout(() => {
        this.flushNow()
        this.flushQueued = false
      }, 0)
      this.flushQueued = true
    }
  }

  flushNow() {
    if (this.bufferedOps.length > 0) {
      const localOps = [], remoteOps = []
      for (const op in this.bufferedOps) {
        (op.isLocal ? localOps : remoteOps).push(op)
      }

      if (localOps.length) {
        this.emit('applylocal', localOps)
      }
      if (remoteOps.length) {
        this.emit('applyremote', remoteOps)
      }

      this.emit('apply', this.bufferedOps)
      this.bufferedOps.length = 0
    }
  }

  applyLocalOperation(id, crdtId, type, opContents) {
    const crdt = this.crdts.get(crdtId[0], crdtId[1])
    const localParents = crdt.registers[opContents.key]?.[0]?.[0]
    return this.applyRemoteOperation({
      id, globalParents: this.globalParents,
      localParents, crdtId, type, ...opContents
    })
  }

  applyRemoteOperation(op) {
    const {
      id, // ID of this operation
      globalParents, // Across all keys
      localParents, // Of this key
      crdtId, type, key,
      primitive, embeddedType // New value
    } = op
    
    assert.strictEqual(type, 'map', 'Only map operations are supported')
    
    this.version = advanceFrontier(this.version, id, globalParents)

    const crdt = this.crdts.get(crdtId[0], crdtId[1])
    if (crdt == null) {
      return // The object has been deleted
    }

    let pairs = crdt.registers[key] ??= []
    const oldVersion = pairs[0]?.[0] // undef or the old version
    pairs = crdt.registers[key] = advanceRegister(pairs, id, primitive ?? embeddedType, localParents)
    const newVersion = pairs[0][1]

    if (newVersion !== oldVersion) {
      if (primitive !== undefined) {
        crdt.value[key] = primitive
      } else {
        assert.strictEqual(embeddedType, 'map')
        const value = {}
        crdt.value[key] = value
        this.crdts.set(newVersion, {
          type: 'map',
          versions: {},
          value,
        })
      }

      // crdt.versions[key] = newVersion

      op.isLocal = false
      this.bufferedOps.push(op)
      this.flushSoon()
      return newVersion
    } else {
      return -1
    }
  }
}

export default Storage
