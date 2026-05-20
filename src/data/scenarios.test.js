import { describe, it, expect } from 'vitest'
import { scenarios } from './scenarios'

describe('scenarios data', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(scenarios)).toBe(true)
    expect(scenarios.length).toBeGreaterThan(0)
  })

  it('every scenario has required string fields', () => {
    for (const s of scenarios) {
      expect(typeof s.id, s.id).toBe('string')
      expect(typeof s.situation, s.id).toBe('string')
      expect(typeof s.hand, s.id).toBe('string')
      expect(typeof s.explanation, s.id).toBe('string')
    }
  })

  it('every scenario has category preflop or postflop', () => {
    for (const s of scenarios) {
      expect(['preflop', 'postflop'], s.id).toContain(s.category)
    }
  })

  it('every scenario has 2–4 options', () => {
    for (const s of scenarios) {
      expect(s.options.length, s.id).toBeGreaterThanOrEqual(2)
      expect(s.options.length, s.id).toBeLessThanOrEqual(4)
    }
  })

  it('correct exactly matches one option in every scenario', () => {
    for (const s of scenarios) {
      expect(s.options, `${s.id} correct="${s.correct}" not in options`).toContain(s.correct)
    }
  })

  it('all ids are unique', () => {
    const ids = scenarios.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('preflop scenarios have null board', () => {
    for (const s of scenarios.filter(s => s.category === 'preflop')) {
      expect(s.board, s.id).toBeNull()
    }
  })

  it('postflop scenarios have a non-null board string', () => {
    for (const s of scenarios.filter(s => s.category === 'postflop')) {
      expect(typeof s.board, s.id).toBe('string')
    }
  })

  it('has at least 10 preflop and 10 postflop scenarios', () => {
    const pre  = scenarios.filter(s => s.category === 'preflop').length
    const post = scenarios.filter(s => s.category === 'postflop').length
    expect(pre).toBeGreaterThanOrEqual(10)
    expect(post).toBeGreaterThanOrEqual(10)
  })
})
