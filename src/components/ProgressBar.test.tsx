import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { ProgressBar } from './ProgressBar.js'

group('the progress bar', () => {
  it('reports the number it was given rather than clamping it, so a caller that counted wrong fails a test instead of looking finished', () => {
    const markup = renderToStaticMarkup(<ProgressBar pct={140} />)
    expect(markup).toContain('aria-valuenow="140"')
    expect(markup).toContain('width:140%')
  })

  it('keeps the overflowing fill inside the track, so the mistake above does not break the page while it stays a mistake', () => {
    expect(renderToStaticMarkup(<ProgressBar pct={140} />)).toContain('overflow:hidden')
  })

  it('draws its gradient from the two progress tokens rather than from either consumer state vocabulary', () => {
    const markup = renderToStaticMarkup(<ProgressBar pct={40} />)
    expect(markup).toContain('var(--state-progress-from)')
    expect(markup).toContain('var(--state-progress-to)')
  })

  it('says what it is measuring, since a bar under a header with no label is a decoration', () => {
    const markup = renderToStaticMarkup(<ProgressBar pct={40} />)
    expect(markup).toContain('role="progressbar"')
    expect(markup).toContain('aria-label="settled"')
  })
})
