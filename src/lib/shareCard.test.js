import { describe, it, expect } from 'vitest'
import { prepareCardEntries } from './shareCard'

describe('prepareCardEntries', () => {
  it('excludes entries where cashout is null', () => {
    const entries = [
      { playerName: 'Alice', cashout: 120, total_buyin: 100 },
      { playerName: 'Bob',   cashout: null, total_buyin: 100 },
    ]
    const result = prepareCardEntries(entries)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Alice')
  })

  it('sorts by net descending (winners first)', () => {
    const entries = [
      { playerName: 'Alice', cashout: 80,  total_buyin: 100 },
      { playerName: 'Bob',   cashout: 150, total_buyin: 100 },
      { playerName: 'Carol', cashout: 100, total_buyin: 100 },
    ]
    const result = prepareCardEntries(entries)
    expect(result.map(e => e.name)).toEqual(['Bob', 'Carol', 'Alice'])
  })

  it('computes net as cashout minus total_buyin', () => {
    const entries = [
      { playerName: 'Alice', cashout: 150, total_buyin: 100 },
    ]
    expect(prepareCardEntries(entries)[0].net).toBe(50)
  })

  it('handles negative net correctly', () => {
    const entries = [
      { playerName: 'Bob', cashout: 60, total_buyin: 100 },
    ]
    expect(prepareCardEntries(entries)[0].net).toBe(-40)
  })

  it('returns empty array when all entries have null cashout', () => {
    const entries = [
      { playerName: 'Alice', cashout: null, total_buyin: 100 },
    ]
    expect(prepareCardEntries(entries)).toEqual([])
  })
})
