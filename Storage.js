import EventEmitter from 'events'
import assert from 'assert/strict'
import * as causalGraph from './causal-graph.js'

export const ROOT = -1

class Storage extends EventEmitter {
  constructor() {
    super()
    this.causalGraph = causalGraph.create()
    // Map from CRDT id to CRDT value
    this.value = {}
    this.crdts = new Map()
    this.crdts.set(ROOT, {
      type: 'map',
      versions: {},
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

  // set(crdtId, key, newValue) {
  // }

  applyLocalOperation(agent, crdtId, type, opContents) {
    const parents = this.causalGraph.version
    const [seq, version] = causalGraph.assignLocal(this.causalGraph, agent)
    return this.applyRemoteOperation({
      agent, seq, parents, crdtId, type, ...opContents
    })
  }

  applyRemoteOperation(op) {
    const {agent, seq, parents, crdtId, type, key, primitive, embeddedType} = op
    
    assert.strictEqual(type, 'map')
    const crdt = this.crdts.get(crdtId)
    if (crdt == null) {
      return -1
    }
    const oldVersion = crdt.versions[key]
    const newVersion = causalGraph.add(
      this.causalGraph,
      agent,
      seq,
      parents
    )

    const shouldMerge =
      oldVersion == null ||
      causalGraph.shouldMerge(
        this.causalGraph,
        oldVersion,
        newVersion,
        agent
      )

    if (shouldMerge) {
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

      crdt.versions[key] = newVersion

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
