import * as causalGraph from './causal-graph.js'

describe('add', () => {
  test('adds an entry', () => {
    const cg = causalGraph.create()
    const agent = 'agent'
    const seq = 1000
    const parents = []
    const index = causalGraph.add(cg, agent, seq, parents)
    expect(cg.entries.length).toBe(1)
    expect(cg.entries[index]).toEqual({
      agent,
      seq,
      parents,
    })
    expect(causalGraph.fromLocalIndexToEntry(cg, index)).toMatchObject({
      agent,
      seq,
      parents,
    })
    expect(causalGraph.fromEntryToLocalIndex(cg, agent, seq)).toBe(index)
  })
  test('does not add an entry if it already exists', () => {
    const cg = causalGraph.create()
    const agent = 'agent'
    const seq = 1000
    const parents = []
    const index = causalGraph.add(cg, agent, seq, parents)
    const index2 = causalGraph.add(cg, agent, seq, parents)
    expect(index).toBe(0)
    expect(index2).toBe(0)
  })
})

describe('versionContainsTime', () => {
  test('simple case', () => {
    const cg = causalGraph.create()
    const agent = 'agent'
    const seq = 1000
    const index = causalGraph.add(cg, agent, seq, [])
    const index2 = causalGraph.add(cg, agent, seq + 1, [index])
    expect(causalGraph.versionContainsTime(cg, [index2], index)).toBe(true)
  })
  test('complex case', () => {
    const cg = causalGraph.create()
    const i0 = causalGraph.add(cg, 'agent', 0, [])
    const i1 = causalGraph.add(cg, 'agent', 1, [i0])
    const i2 = causalGraph.add(cg, 'agent', 2, [i0])
    const i3 = causalGraph.add(cg, 'agent', 3, [i1, i2])
    const i4 = causalGraph.add(cg, 'agent', 4, [i3])

    expect(causalGraph.versionContainsTime(cg, [i3], i1)).toBe(true)
    expect(causalGraph.versionContainsTime(cg, [i3], i2)).toBe(true)
    expect(causalGraph.versionContainsTime(cg, [i2], i1)).toBe(false)

    expect(causalGraph.versionContainsTime(cg, [i0], i1)).toBe(false)
    expect(causalGraph.versionContainsTime(cg, [i0], i2)).toBe(false)
    expect(causalGraph.versionContainsTime(cg, [i0], i3)).toBe(false)
    expect(causalGraph.versionContainsTime(cg, [i0], i4)).toBe(false)

    expect(causalGraph.versionContainsTime(cg, [i4], i0)).toBe(true)
    expect(causalGraph.versionContainsTime(cg, [i4], i1)).toBe(true)
    expect(causalGraph.versionContainsTime(cg, [i4], i2)).toBe(true)
    expect(causalGraph.versionContainsTime(cg, [i4], i3)).toBe(true)
  })
})
