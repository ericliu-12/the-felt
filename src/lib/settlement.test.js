import { describe, it, expect } from 'vitest'
import { computeSettlement } from './settlement'

describe('computeSettlement', () => {
  it('single debtor pays single creditor', () => {
    const result = computeSettlement([
      { name: 'Alice', totalBuyin: 100, cashout: 140 },
      { name: 'Bob',   totalBuyin: 100, cashout: 60  },
    ])
    expect(result).toEqual([{ from: 'Bob', to: 'Alice', amount: 40 }])
  })

  it('net-zero player is skipped', () => {
    const result = computeSettlement([
      { name: 'Alice', totalBuyin: 100, cashout: 100 },
      { name: 'Bob',   totalBuyin: 100, cashout: 130 },
      { name: 'Carol', totalBuyin: 100, cashout: 70  },
    ])
    expect(result).toEqual([{ from: 'Carol', to: 'Bob', amount: 30 }])
  })

  it('minimizes transactions: one creditor, two debtors', () => {
    const result = computeSettlement([
      { name: 'Alice', totalBuyin: 100, cashout: 160 },
      { name: 'Bob',   totalBuyin: 100, cashout: 70  },
      { name: 'Carol', totalBuyin: 100, cashout: 70  },
    ])
    expect(result).toHaveLength(2)
    expect(result.find(t => t.from === 'Bob')).toEqual({ from: 'Bob',   to: 'Alice', amount: 30 })
    expect(result.find(t => t.from === 'Carol')).toEqual({ from: 'Carol', to: 'Alice', amount: 30 })
  })

  it('handles floating point amounts without drift', () => {
    const result = computeSettlement([
      { name: 'Alice', totalBuyin: 100, cashout: 125.50 },
      { name: 'Bob',   totalBuyin: 100, cashout: 74.50  },
    ])
    expect(result[0].amount).toBe(25.5)
  })

  it('returns empty array when all break even', () => {
    const result = computeSettlement([
      { name: 'Alice', totalBuyin: 100, cashout: 100 },
    ])
    expect(result).toEqual([])
  })
})
