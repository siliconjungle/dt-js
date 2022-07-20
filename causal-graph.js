import PriorityQueue from 'priorityqueuejs'

// A list, index into it is the local order the op was received
// The value is the version of the op and the parents
// Then there is a mapping from version to local index.
export const create = () => ({
  entries: [],
  idToEntry: {},
  version: []
})

export const advanceFrontier = (frontier, version, parents) => {
  // assert(!branchContainsVersion(db, order, branch), 'db already contains version')
  // for (const parent of op.parents) {
  //    assert(branchContainsVersion(db, parent, branch), 'operation in the future')
  // }

  const f = frontier.filter(v => !parents.includes(v))
  f.push(version)
  return f.sort((a, b) => a - b)
}

export const getEntriesForAgent = (causalGraph, agent) => (
  causalGraph.idToEntry[agent] ??= []
)

export const add = (causalGraph, agent, seq, parents) => {
  const entry = {
    agent,
    seq,
    parents,
  }
  const entries = getEntriesForAgent(causalGraph, agent)
  if (entries[seq] != null) {
    return entries[seq]
  }

  const index = causalGraph.entries.length
  entries[seq] = index

  causalGraph.entries.push(entry)
  causalGraph.version = advanceFrontier(causalGraph.version, index, parents)

  return index
}

export const assignLocal = (causalGraph, agent) => {
  const entries = getEntriesForAgent(causalGraph, agent)
  const seq = entries.length
  const version = add(causalGraph, agent, seq, causalGraph.version)
  return [seq, version]
}

export const fromLocalIndexToEntry = (causalGraph, localIndex) =>
  causalGraph.entries[localIndex]

export const fromEntryToLocalIndex = (causalGraph, agent, seq) =>
  getEntriesForAgent(causalGraph, agent)[seq]

export const versionContainsTime = (causalGraph, frontier, target) => {
  const queue = new PriorityQueue((a, b) => a - b)
  frontier.filter((v) => v >= target).forEach((v) => queue.enq(v))
  while (queue.size() > 0) {
    const v = queue.deq()
    if (v === target) {
      return true
    }
    const entry = fromLocalIndexToEntry(causalGraph, v)
    entry.parents.filter((v) => v >= target).forEach((p) => queue.enq(p))
  }
  return false
}

export const compareVersions = (causalGraph, a, b) => {
  if (a > b) {
    return versionContainsTime(causalGraph, [a], b) ? -1 : 0
  } else if (a < b) {
    return versionContainsTime(causalGraph, [b], a) ? 1 : 0
  }
  throw new Error('a and b are equal')
}

export const shouldMerge = (causalGraph, oldVersion, newVersion, agent) => {
  const cmp = compareVersions(causalGraph, oldVersion, newVersion)

  return (
    cmp < 0 ||
    (cmp === 0 && agent > fromLocalIndexToEntry(causalGraph, oldVersion).agent)
  )
}
