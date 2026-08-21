import { describe as group, expect, it } from 'vitest'

import { duration, spellMinutes } from './time.js'

/**
 * THE TWO SIDES OF THIS MOVE ROUNDED DIFFERENTLY, and these are the cases where that shows. Every
 * assertion below either passes on both of the two implementations or is one of the four places
 * they disagreed, which is what makes this file the record of the decision rather than a restatement
 * of the code.
 */
group('spelling how long something took', () => {
  it('says seconds on their own below a minute', () => {
    expect(duration(0)).toBe('0s')
    expect(duration(45_000)).toBe('45s')
  })

  it('rounds to the nearest second rather than truncating toward zero', () => {
    // The disagreement. Truncating reports this as 59s while every clock beside it has turned over.
    expect(duration(59_600)).toBe('1m')
    expect(duration(59_400)).toBe('59s')
  })

  it('treats a clock that went backwards as no time at all rather than as negative time', () => {
    expect(duration(-5_000)).toBe('0s')
  })

  it('keeps the seconds under an hour, where they are the difference between fast and rounded', () => {
    expect(duration(8 * 60_000 + 45_000)).toBe('8m 45s')
    expect(duration(119_000)).toBe('1m 59s')
  })

  it('drops a unit worth nothing rather than printing a zero into it', () => {
    // The second disagreement, at both ends of the number.
    expect(duration(9 * 60_000)).toBe('9m')
    expect(duration(60 * 60_000)).toBe('1h')
  })

  it('drops the seconds above an hour, where they are noise', () => {
    expect(duration(8 * 60 * 60_000 + 33 * 60_000)).toBe('8h 33m')
    expect(duration(87 * 60 * 60_000 + 51 * 60_000 + 30_000)).toBe('87h 51m')
  })
})

group('spelling an estimate that arrives in whole minutes', () => {
  it('reads the same as the measurement it sits beside', () => {
    expect(spellMinutes(25)).toBe('25m')
    expect(spellMinutes(5271)).toBe('87h 51m')
  })

  it('says an exact hour as an hour, because the trailing zero is a unit that is not there', () => {
    // The same argument one of the two repositories made about a leading "0h", applied to the tail.
    expect(spellMinutes(60)).toBe('1h')
    expect(spellMinutes(120)).toBe('2h')
  })

  it('spells nothing priced as nothing rather than refusing to answer', () => {
    // The dash for "never priced" belongs to `HumanCost`; a zero handed to this is still a duration.
    expect(spellMinutes(0)).toBe('0s')
  })
})
