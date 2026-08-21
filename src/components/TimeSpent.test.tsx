import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { TimeSpent } from './TimeSpent.js'

group('how long the machine took over one job', () => {
  it('says the span over the count, because the two are read together', () => {
    const said = renderToStaticMarkup(<TimeSpent ms={8 * 60_000 + 45_000} events={1834} />)

    expect(said).toContain('8m 45s')
    expect(said).toContain('1,834 event(s)')
  })

  it('groups the count, so an order of magnitude cannot be misread as a digit', () => {
    expect(renderToStaticMarkup(<TimeSpent ms={1_000} events={18_340} />)).toContain(
      '18,340 event(s)',
    )
  })

  it('says nothing rather than nought seconds for a job that has not started', () => {
    // "0s" states a duration for work nobody has done, and a queued row is exactly where a reader
    // is deciding whether anything is happening at all.
    expect(renderToStaticMarkup(<TimeSpent ms={null} events={0} />)).toContain('—')
    expect(renderToStaticMarkup(<TimeSpent ms={null} events={0} />)).not.toContain('0s')
  })

  it('withholds the count as well when there is no span to report', () => {
    // A count beside a dash invites the reading that the job ran and produced nothing.
    expect(renderToStaticMarkup(<TimeSpent ms={null} events={12} />)).not.toContain('event(s)')
  })

  it('leaves the span in the page’s own ink and sets the count down out of the way', () => {
    // The span is the measurement; the count is the footnote to it. One colour for both would make
    // the cell one fact.
    const said = renderToStaticMarkup(<TimeSpent ms={1_000} events={3} />)

    expect(said).toContain('<span>1s</span>')
    expect(said).toContain('color:var(--text-tertiary)')
  })
})
