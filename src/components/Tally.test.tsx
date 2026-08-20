import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { STRIP, Tally } from './Tally.js'

group('the tally', () => {
  it('colours a plain tally with the primary text token, which is the colour it inherited before the tone prop existed', () => {
    const markup = renderToStaticMarkup(<Tally value={12} label="settled" />)
    expect(markup).toContain('color:var(--text-primary)')
  })

  it('reaches for the count tokens rather than the pill tones, because a number that moved and a settled verdict are different claims', () => {
    expect(renderToStaticMarkup(<Tally value={4} label="cleared" tone="good" />)).toContain(
      'color:var(--state-count-good)',
    )
    expect(renderToStaticMarkup(<Tally value={2} label="introduced" tone="alarm" />)).toContain(
      'color:var(--state-count-alarm)',
    )
  })

  it('takes a node for the value, since `40 / 356` and `6h 34m` are both legitimate counts', () => {
    const markup = renderToStaticMarkup(<Tally value={<i>{'40 / 356'}</i>} label="settled" />)
    expect(markup).toContain('<i>40 / 356</i>')
  })

  it('starts the strip where both dashboards start their page, so the two read as one application', () => {
    expect(STRIP.padding).toBe('14px 24px')
  })
})
