import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { Pill } from './Pill.js'

group('the pill', () => {
  /**
   * THE ASSERTION THIS FILE EXISTS FOR.
   *
   * `animate-pulse` is the only class name in the package, and moving this component into
   * `node_modules` puts it outside the globs a consumer's Tailwind scans. The utility stops being
   * emitted, the dot stops pulsing, and nothing errors. This test cannot see the consumer's build,
   * so it guards the half it can: the class is still asked for, and asked for only where it means
   * something. The other half is a grep over the consumer's built stylesheet, in ADOPTING.md.
   */
  it('asks for the pulsing dot only on the running tone, because that class is the one thing here a consumer build has to be told to emit', () => {
    expect(renderToStaticMarkup(<Pill tone="running">{'bumping'}</Pill>)).toContain('animate-pulse')
    expect(renderToStaticMarkup(<Pill tone="good">{'PASS'}</Pill>)).not.toContain('animate-pulse')
  })

  it('hides the dot from a screen reader, which has no use for a decoration that says the same word twice', () => {
    expect(renderToStaticMarkup(<Pill tone="running">{'bumping'}</Pill>)).toContain(
      'aria-hidden="true"',
    )
  })

  it('resolves every tone through a contract token, so no colour enters this package', () => {
    for (const tone of ['good', 'warn', 'quiet', 'alarm', 'running', 'aside'] as const) {
      expect(renderToStaticMarkup(<Pill tone={tone}>{tone}</Pill>)).toContain(
        `--pill-tone:var(--state-${tone})`,
      )
    }
  })

  it('sets the tone once and reads it three times, so the text, the wash and the edge cannot drift apart', () => {
    const markup = renderToStaticMarkup(<Pill tone="alarm">{'lost a test'}</Pill>)
    expect(markup.match(/var\(--pill-tone\)/g)).toHaveLength(3)
  })

  it('hangs the caller title on the pill, which is where the meaning of a one-word verdict goes', () => {
    expect(
      renderToStaticMarkup(
        <Pill tone="warn" title="the build ran but the version did not move">
          {'not bumped'}
        </Pill>,
      ),
    ).toContain('title="the build ran but the version did not move"')
  })

  it('draws a span when there is nowhere to go and an anchor when there is, so a pill that is not a link is not focusable', () => {
    expect(renderToStaticMarkup(<Pill tone="good">{'PASS'}</Pill>).startsWith('<span')).toBe(true)
    const linked = renderToStaticMarkup(
      <Pill tone="good" href="/bump?id=7">
        {'PASS'}
      </Pill>,
    )
    expect(linked.startsWith('<a')).toBe(true)
    expect(linked).toContain('href="/bump?id=7"')
  })
})
