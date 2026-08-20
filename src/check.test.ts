import { describe as group, expect, it } from 'vitest'

import {
  checkFinding,
  checkHealth,
  checkItemDetail,
  checkManifest,
  checkRecordEvent,
  checkWorkItem,
  checkWorkItems,
  describe,
} from './check.js'

/**
 * WHAT THESE TESTS ARE ACTUALLY FOR.
 *
 * Not "does the validator notice a missing string", which is the same rule written eleven times.
 * The rules worth spending a test on are the ones where a plausible implementation gets it wrong
 * and nothing downstream complains until a page is already drawing something misleading:
 *
 *   - null and absent are different, and a validator that conflates them is worse than none,
 *     because it certifies the shape that caused the bug this contract exists to prevent;
 *   - every problem is reported, not the first, because a list is how a server gets fixed in one
 *     pass instead of six;
 *   - nothing throws, ever, including on the inputs a caller reaches for in a `catch`;
 *   - a manifest can be type-perfect and still internally broken.
 *
 * A valid document is built by a helper here rather than written out per test, so that a test about
 * one bad field is visibly about one bad field.
 */

function aWorkItem(changes: Record<string, unknown> = {}): unknown {
  return { id: 'rr_8_174', state: 'PASS', because: 'gate green', events: 42, at: 1787073373152, ...changes }
}

function aRecordEvent(changes: Record<string, unknown> = {}): unknown {
  return { at: 1787073373152, kind: 'settled', agent: null, ...changes }
}

function aFinding(changes: Record<string, unknown> = {}): unknown {
  return { id: '7', title: 'Four repositories fail the same way', body: 'All four...', verdict: 'holds', items: ['a', 'b'], ...changes }
}

function aManifest(changes: Record<string, unknown> = {}): unknown {
  return {
    id: 'a-tool',
    name: 'A tool',
    description: 'Does a thing.',
    version: '09b7e89c',
    basePath: '/a-tool',
    assetPrefix: '/a-tool-static',
    api: '/a-tool/api',
    health: '/a-tool/api/health',
    nav: [{ label: 'Home', path: '/', badge: null }],
    badges: {},
    ...changes,
  }
}

group('a work item', () => {
  it('accepts the shape a pipeline actually serves', () => {
    expect(checkWorkItem(aWorkItem())).toEqual([])
  })

  it('accepts an explicit null for the reason, because null means nothing has been said yet', () => {
    expect(checkWorkItem(aWorkItem({ because: null }))).toEqual([])
  })

  it('rejects a missing reason, because an absent key is a server that forgot rather than a server with nothing to say', () => {
    const problems = checkWorkItem(aWorkItem({ because: undefined }))
    expect(problems).toEqual([{ path: 'item.because', says: 'is missing, expected a string or null' }])
  })

  it('distinguishes the missing reason from the null one, which is the whole reason this file exists', () => {
    expect(checkWorkItem(aWorkItem({ because: null }))).toEqual([])
    expect(checkWorkItem(aWorkItem({ because: undefined }))).toHaveLength(1)
  })

  it('accepts a start time when the pipeline records one and does not require it when it cannot', () => {
    expect(checkWorkItem(aWorkItem({ startedAt: 1787073000000 }))).toEqual([])
    expect(checkWorkItem(aWorkItem())).toEqual([])
  })

  it('rejects a start time that is present and of the wrong kind, which is the point of an optional field', () => {
    const problems = checkWorkItem(aWorkItem({ startedAt: 'yesterday' }))
    expect(problems).toEqual([{ path: 'item.startedAt', says: 'expected a number, got a string' }])
  })

  it('rejects a count that arrived as a string, which is what an unquoted template in a server emits', () => {
    const problems = checkWorkItem(aWorkItem({ events: '42' }))
    expect(problems).toEqual([{ path: 'item.events', says: 'expected a number, got a string' }])
  })

  it('rejects a negative or fractional count, because neither can be a number of recorded lines', () => {
    expect(checkWorkItem(aWorkItem({ events: -1 }))).toHaveLength(1)
    expect(checkWorkItem(aWorkItem({ events: 1.5 }))).toHaveLength(1)
  })

  it('rejects a time that is not finite, since NaN passes a typeof check and then poisons every comparison', () => {
    const problems = checkWorkItem(aWorkItem({ at: Number.NaN }))
    expect(problems).toEqual([{ path: 'item.at', says: 'expected a finite number, got NaN' }])
  })

  it('reports every problem at once rather than stopping at the first', () => {
    const problems = checkWorkItem({ id: 1, state: null, events: 'lots' })
    expect(problems.map((problem) => problem.path)).toEqual([
      'item.id',
      'item.state',
      'item.because',
      'item.events',
      'item.at',
    ])
  })

  it('says plainly that an array is not an object instead of reporting five missing fields', () => {
    expect(checkWorkItem([])).toEqual([{ path: 'item', says: 'expected a work item object, got an array' }])
  })

  it('says plainly that null is not an object, since typeof null is object and every hand-written check forgets it', () => {
    expect(checkWorkItem(null)).toEqual([{ path: 'item', says: 'expected a work item object, got null' }])
  })

  it('accepts any state string at all, because each pipeline owns its own vocabulary', () => {
    expect(checkWorkItem(aWorkItem({ state: 'verified/pr-ready' }))).toEqual([])
    expect(checkWorkItem(aWorkItem({ state: 'FAIL_test_conservation' }))).toEqual([])
    expect(checkWorkItem(aWorkItem({ state: 'a state nobody has invented yet' }))).toEqual([])
  })
})

group('a queue of work items', () => {
  it('names the bad row by its index so a problem in four hundred rows can be found without counting', () => {
    const problems = checkWorkItems([aWorkItem(), aWorkItem({ id: 9 }), aWorkItem()])
    expect(problems).toEqual([{ path: 'items[1].id', says: 'expected a string, got a number' }])
  })

  it('accepts an empty queue, because a sweep that has not started is not a malformed sweep', () => {
    expect(checkWorkItems([])).toEqual([])
  })

  it('rejects a queue that arrived as an object, which is what a server wrapping a list in an envelope sends', () => {
    expect(checkWorkItems({ rows: [] })).toEqual([
      { path: 'items', says: 'expected an array of work items, got a object' },
    ])
  })
})

group('a record event', () => {
  it('accepts a line no agent produced, because deterministic steps record events too', () => {
    expect(checkRecordEvent(aRecordEvent({ agent: null }))).toEqual([])
  })

  it('rejects an absent agent even though null is fine, for the same reason as the reason field', () => {
    const problems = checkRecordEvent({ at: 1, kind: 'built' })
    expect(problems).toEqual([{ path: 'event.agent', says: 'is missing, expected a string or null' }])
  })

  it('does not require a body, because one pipeline records a single text and the other splits a call in two', () => {
    expect(checkRecordEvent(aRecordEvent())).toEqual([])
    expect(checkRecordEvent(aRecordEvent({ text: 'a very long prompt' }))).toEqual([])
  })

  it('accepts a kind it has never heard of, because a record outlives the code that reads it', () => {
    expect(checkRecordEvent(aRecordEvent({ kind: 'metered' }))).toEqual([])
    expect(checkRecordEvent(aRecordEvent({ kind: 'exchange' }))).toEqual([])
  })
})

group('an item detail', () => {
  it('checks the item and every event, and names each event by its index', () => {
    const problems = checkItemDetail({
      item: aWorkItem(),
      events: [aRecordEvent(), aRecordEvent({ at: 'now' })],
    })
    expect(problems).toEqual([{ path: 'detail.events[1].at', says: 'expected a number, got a string' }])
  })

  it('reports a missing events array rather than treating no history as an empty history', () => {
    const problems = checkItemDetail({ item: aWorkItem() })
    expect(problems).toEqual([{ path: 'detail.events', says: 'is missing, expected an array' }])
  })

  it('accepts an item that has recorded nothing yet', () => {
    expect(checkItemDetail({ item: aWorkItem({ events: 0 }), events: [] })).toEqual([])
  })
})

group('a finding', () => {
  it('accepts the shape a supervising pass produces', () => {
    expect(checkFinding(aFinding())).toEqual([])
  })

  it('accepts a finding about no items, since a claim can be about the corpus rather than a row', () => {
    expect(checkFinding(aFinding({ items: [] }))).toEqual([])
  })

  it('rejects an item reference that is not a string, naming which one', () => {
    const problems = checkFinding(aFinding({ items: ['a', 7] }))
    expect(problems).toEqual([{ path: 'finding.items[1]', says: 'expected an item id string, got a number' }])
  })

  it('requires an id, because a findings page groups by verdict and a link computed from display order moves when a critic answers', () => {
    const problems = checkFinding(aFinding({ id: undefined }))
    expect(problems).toEqual([{ path: 'finding.id', says: 'is missing, expected a string' }])
  })
})

group('a manifest', () => {
  it('accepts the document both pipelines already serve', () => {
    expect(checkManifest(aManifest())).toEqual([])
  })

  it('accepts a nav item pointing at a badge the manifest defines', () => {
    const manifest = aManifest({
      nav: [{ label: 'Findings', path: '/findings', badge: 'findings' }],
      badges: { findings: { endpoint: '/api/badges', field: 'findings' } },
    })
    expect(checkManifest(manifest)).toEqual([])
  })

  it('rejects a nav item naming a badge that is not defined, which is type-perfect and still broken', () => {
    const manifest = aManifest({
      nav: [{ label: 'Findings', path: '/findings', badge: 'findings' }],
      badges: {},
    })
    expect(checkManifest(manifest)).toEqual([
      { path: 'manifest.nav[0].badge', says: "names the badge 'findings', which this manifest does not define" },
    ])
  })

  it('accepts a nav item with no badge at all, which is most of them', () => {
    expect(checkManifest(aManifest({ nav: [{ label: 'Home', path: '/', badge: null }] }))).toEqual([])
  })

  it('rejects a badge that is missing the field the shell is supposed to read', () => {
    const manifest = aManifest({ badges: { findings: { endpoint: '/api/badges' } } })
    expect(checkManifest(manifest)).toEqual([
      { path: 'manifest.badges.findings.field', says: 'is missing, expected a string' },
    ])
  })

  it('does not also complain that a badge is undefined when the nav item itself was malformed', () => {
    const manifest = aManifest({ nav: [{ label: 'Findings', path: 7, badge: 'findings' }] })
    expect(checkManifest(manifest).map((problem) => problem.path)).toEqual(['manifest.nav[0].path'])
  })
})

group('a health response', () => {
  it('accepts a healthy tool naming the version it is running', () => {
    expect(checkHealth({ ok: true, version: '09b7e89c' })).toEqual([])
  })

  it('accepts an unhealthy tool saying why', () => {
    expect(checkHealth({ ok: false, why: 'the record directory is not readable' })).toEqual([])
  })

  it('rejects a tool reporting that it is broken and declining to say why', () => {
    expect(checkHealth({ ok: false, version: '09b7e89c' })).toEqual([
      { path: 'health.why', says: 'is missing, expected a string' },
    ])
  })

  it('rejects an ok that is truthy rather than true, since a string is not a health answer', () => {
    expect(checkHealth({ ok: 'yes' })).toEqual([{ path: 'health.ok', says: 'expected true or false, got a string' }])
  })
})

group('every validator', () => {
  const validators = [
    checkWorkItem,
    checkWorkItems,
    checkRecordEvent,
    checkItemDetail,
    checkFinding,
    checkManifest,
    checkHealth,
  ]

  /**
   * The values a caller actually reaches for in the `catch` of a fetch, plus the ones a hand-written
   * check trips over. A validator that throws on any of these is unusable exactly where it is needed.
   */
  const hostile: unknown[] = [undefined, null, 0, '', 'a string', [], {}, new Error('network'), NaN, () => 0]

  it('returns problems rather than throwing, on every input including the ones a caller passes from a catch', () => {
    for (const validate of validators) {
      for (const value of hostile) {
        expect(() => validate(value)).not.toThrow()
      }
    }
  })

  it('returns a list rather than a boolean, so an empty list is the only way to be valid', () => {
    for (const validate of validators) {
      expect(Array.isArray(validate(undefined))).toBe(true)
      expect(validate(undefined).length).toBeGreaterThan(0)
    }
  })

  it('does not throw on an object whose getter throws, which is why the guard exists at all', () => {
    const booby = Object.defineProperty({}, 'id', {
      get() {
        throw new Error('deliberately hostile')
      },
      enumerable: true,
    })
    expect(() => checkWorkItem(booby)).not.toThrow()
    expect(checkWorkItem(booby)[0]?.says).toContain('could not be read')
  })

  it('takes a caller-supplied path so a problem can be reported where the document actually sits', () => {
    expect(checkWorkItem(null, 'response.rows[3]')).toEqual([
      { path: 'response.rows[3]', says: 'expected a work item object, got null' },
    ])
  })
})

group('describing problems', () => {
  it('says so plainly when there is nothing wrong', () => {
    expect(describe([])).toBe('no problems')
  })

  it('puts one problem on each line, in the order they were found', () => {
    const problems = checkWorkItem({})
    expect(describe(problems).split('\n')).toHaveLength(problems.length)
    expect(describe(problems)).toContain('item.id is missing, expected a string')
  })
})
