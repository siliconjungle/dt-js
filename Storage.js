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
  }

  // [agent, seq, parents, crdtId, type, key, value]
  applyOperations(ops, isLocal) {
    const filteredOps = ops.filter(
      ([agent, seq, parents, crdtId, type, key, value]) => {
        assert.strictEqual(type, 'map')
        const crdt = this.crdts.get(crdtId)
        if (crdt == null) {
          return false
        }
        const oldVersion = crdt.versions[key]
        const newVersion = causalGraph.add(
          this.causalGraph,
          agent,
          seq,
          parents
        )
        let shouldMerge
        if (oldVersion == null) {
          shouldMerge = true
        } else {
          const cmp = causalGraph.compareVersions(
            this.causalGraph,
            oldVersion,
            newVersion
          )
          shouldMerge =
            cmp < 0 ||
            (cmp === 0 &&
              agent >
                causalGraph.fromLocalIndexToEntry(this.causalGraph, oldVersion)
                  .agent)
        }

        if (shouldMerge) {
          crdt.value[key] = value
          crdt.versions[key] = newVersion
        }

        return shouldMerge
      }
    )

    if (filteredOps.length > 0) {
      this.emit(isLocal ? 'applylocal' : 'applyremote', filteredOps)
    }
  }
}

export default Storage
