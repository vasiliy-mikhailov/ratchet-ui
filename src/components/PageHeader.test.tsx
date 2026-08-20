import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { CORNER, PageHeader } from './PageHeader.js'

group('the page header', () => {
  /**
   * The one behavioural difference between the two dashboards' headers. One hard-coded its three
   * corner controls and always drew the row; this one takes them as a node. A caller that always
   * passes something produces the same DOM it produced before, which is what makes the move safe;
   * a caller that passes nothing must not get an empty flex box holding the title away from the
   * edge it is supposed to sit against.
   */
  it('draws the corner row only when a caller passes actions, so a screen with no controls gets no empty box', () => {
    const withActions = renderToStaticMarkup(
      <PageHeader title="bumps" subtitle="356 repositories" actions={<button>{'⚙'}</button>} />,
    )
    expect(withActions).toContain('margin-left:auto')
    expect(withActions).toContain('<button>⚙</button>')

    const without = renderToStaticMarkup(<PageHeader title="bumps" subtitle="356 repositories" />)
    expect(without).not.toContain('margin-left:auto')
  })

  it('takes a node for the subtitle, since a screen composes a pill and an entity into it rather than a sentence', () => {
    const markup = renderToStaticMarkup(
      <PageHeader
        title="commons-lang"
        subtitle={
          <>
            {'8 → 17 · '}
            <span>{'PASS'}</span>
          </>
        }
      />,
    )
    expect(markup).toContain('8 → 17 · <span>PASS</span>')
  })

  it('escapes what a caller puts in the title, which the string-concatenating original did for the title and not for the subtitle', () => {
    const markup = renderToStaticMarkup(
      <PageHeader title={'checker "A & B"'} subtitle={'<not markup>'} />,
    )
    expect(markup).toContain('checker &quot;A &amp; B&quot;')
    expect(markup).toContain('&lt;not markup&gt;')
  })

  it('links the crumb to the destination it names rather than to a fixed one, and draws none when there is nowhere back', () => {
    const markup = renderToStaticMarkup(
      <PageHeader title="attempt 3" subtitle="" back={{ label: 'commons-lang', href: '/bump?id=7' }} />,
    )
    expect(markup).toContain('href="/bump?id=7"')
    expect(markup).toContain('← commons-lang')
    expect(renderToStaticMarkup(<PageHeader title="bumps" subtitle="" />)).not.toContain('←')
  })

  it('exports the corner metrics, because the controls are the caller now and a caller that guesses them guesses differently on the second screen', () => {
    expect(CORNER.fontSize).toBe('1.25rem')
    expect(CORNER.padding).toBe('0.2rem 0.35rem')
  })
})
