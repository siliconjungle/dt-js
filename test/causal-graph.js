import * as causalGraph from '../causal-graph.js'
import assert from 'assert/strict'

describe('add', () => {
  it('adds an entry', () => {
    const cg = causalGraph.create()
    const agent = 'agent'
    const seq = 1000
    const parents = []
    const index = causalGraph.add(cg, agent, seq, parents)
    assert.equal(cg.entries.length, 1)
    assert.deepEqual(cg.entries[index], {
      agent,
      seq,
      parents,
    })
    assert.deepEqual(causalGraph.fromLocalIndexToEntry(cg, index), {
      agent,
      seq,
      parents,
    })
    assert.equal(causalGraph.fromEntryToLocalIndex(cg, agent, seq), index)
  })
  it('does not add an entry if it already exists', () => {
    const cg = causalGraph.create()
    const agent = 'agent'
    const seq = 1000
    const parents = []
    const index = causalGraph.add(cg, agent, seq, parents)
    const index2 = causalGraph.add(cg, agent, seq, parents)
    assert.equal(index, 0)
    assert.equal(index2, 0)
  })
})

describe('versionContainsTime', () => {
  it('simple case', () => {
    const cg = causalGraph.create()
    const agent = 'agent'
    const seq = 1000
    const index = causalGraph.add(cg, agent, seq, [])
    const index2 = causalGraph.add(cg, agent, seq + 1, [index])
    assert.equal(causalGraph.versionContainsTime(cg, [index2], index), true)
  })
  it('complex case', () => {
    const cg = causalGraph.create()
    const i0 = causalGraph.add(cg, 'agent', 0, [])
    const i1 = causalGraph.add(cg, 'agent', 1, [i0])
    const i2 = causalGraph.add(cg, 'agent', 2, [i0])
    const i3 = causalGraph.add(cg, 'agent', 3, [i1, i2])
    const i4 = causalGraph.add(cg, 'agent', 4, [i3])

    assert.equal(causalGraph.versionContainsTime(cg, [i3], i1), true)
    assert.equal(causalGraph.versionContainsTime(cg, [i3], i2), true)
    assert.equal(causalGraph.versionContainsTime(cg, [i2], i1), false)

    assert.equal(causalGraph.versionContainsTime(cg, [i0], i1), false)
    assert.equal(causalGraph.versionContainsTime(cg, [i0], i2), false)
    assert.equal(causalGraph.versionContainsTime(cg, [i0], i3), false)
    assert.equal(causalGraph.versionContainsTime(cg, [i0], i4), false)

    assert.equal(causalGraph.versionContainsTime(cg, [i4], i0), true)
    assert.equal(causalGraph.versionContainsTime(cg, [i4], i1), true)
    assert.equal(causalGraph.versionContainsTime(cg, [i4], i2), true)
    assert.equal(causalGraph.versionContainsTime(cg, [i4], i3), true)
  })
})
