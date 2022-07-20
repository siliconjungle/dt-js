import PriorityQueue from 'priorityqueuejs'

// A list, index into it is the local order the op was received
// The value is the version of the op and the parents
// Then there is a mapping from version to local index.
export const create = () => ({
  entries: [],
  idToEntry: {},
})

export const getEntriesForAgent = (casualGraph, agent) => {
  casualGraph.idToEntry[agent] = casualGraph.idToEntry[agent] || []
  return casualGraph.idToEntry[agent]
}

export const add = (casualGraph, agent, seq, parents) => {
  const entry = {
    agent,
    seq,
    parents,
  }
  const entries = getEntriesForAgent(casualGraph, agent)
  if (entries[seq] != null) {
    return entries[seq]
  }

  const index = casualGraph.entries.length
  entries[seq] = index

  casualGraph.entries.push(entry)

  return index
}

export const fromLocalIndexToEntry = (casualGraph, localIndex) => {
  return casualGraph.entries[localIndex]
}

export const fromEntryToLocalIndex = (casualGraph, agent, seq) =>
  getEntriesForAgent(casualGraph, agent)[seq]

export const versionContainsTime = (casualGraph, frontier, target) => {
  const queue = new PriorityQueue((a, b) => a - b)
  frontier.filter((v) => v >= target).forEach((v) => queue.enq(v))
  while (queue.size() > 0) {
    const v = queue.deq()
    if (v === target) {
      return true
    }
    const entry = fromLocalIndexToEntry(casualGraph, v)
    entry.parents.filter((v) => v >= target).forEach((p) => queue.enq(p))
  }
  return false
}

export const compareVersions = (causalGraph, a, b) => {
  if (a > b) {
    if (versionContainsTime(causalGraph, [a], b)) {
      return -1
    } else {
      return 0
    }
  } else if (a < b) {
    if (versionContainsTime(causalGraph, [b], a)) {
      return 1
    } else {
      return 0
    }
  }
  throw new Error('a and b are equal')
}
