import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { Lamp } from './Lamp.js'

/**
 * THE THING WORTH ASSERTING IS THAT THREE STATES STAY THREE.
 *
 * A lamp that is only ever on or off tells a reader that a stage which ran and answered no and a
 * stage that was never reached are the same answer. Every test below is a different way of asking
 * whether the middle one is still distinguishable, because the middle one is the one an edit
 * collapses first.
 *
 * NO COLOUR IS NAMED HERE EITHER. The caller's colour in these fixtures is a contract NAME rather
 * than a value, for the same reason the package carries no palette: a hex in a test fixture is a
 * hex in this repository.
 */
const CALLER = 'var(--accent-primary)'

const occurrences = (markup: string, needle: string): number => markup.split(needle).length - 1

group('one lamp', () => {
  it('fills the lit lamp and rings it and glows it from one declaration, so the fill, the edge and the glow cannot drift apart', () => {
    const markup = renderToStaticMarkup(<Lamp lit reached colour={CALLER} label="it went green" />)
    expect(markup).toContain(`--lamp:${CALLER}`)
    // Three readings of the one property: background, border and shadow.
    expect(occurrences(markup, 'var(--lamp)')).toBe(3)
    expect(markup).toContain('box-shadow:0 0 5px color-mix(in srgb, var(--lamp) 40%, transparent)')
  })

  it('keeps the caller colour in the dim lamp and out of the hollow one, because a stage never reached has nothing to say in that colour', () => {
    const dim = renderToStaticMarkup(
      <Lamp lit={false} reached colour={CALLER} label="it ran and did not go green" />,
    )
    const hollow = renderToStaticMarkup(
      <Lamp lit={false} reached={false} colour={CALLER} label="it was never got to" />,
    )
    expect(dim).toContain(`--lamp:${CALLER}`)
    expect(dim).toContain('background:color-mix(in srgb, var(--lamp) 18%, transparent)')
    // A wash inside a ring of the same colour says the lamp is there and is off. No glow, because
    // the glow is what "the build said so" looks like.
    expect(dim).not.toContain('box-shadow')
    expect(hollow).not.toContain('--lamp')
    expect(hollow).not.toContain('accent-primary')
  })

  it('parts dim from hollow by three signals rather than one, so a reader who cannot separate two washes of one colour still has the dash', () => {
    const hollow = renderToStaticMarkup(
      <Lamp lit={false} reached={false} colour={CALLER} label="never got this far" />,
    )
    expect(hollow).toContain('background:transparent')
    expect(hollow).toContain('border-color:var(--border-strong)')
    expect(hollow).toContain('border-style:dashed')
  })

  it('carries the whole sentence as its accessible name rather than hanging a tooltip on an empty element, because these labels carry the standard of proof', () => {
    const sentence = 'the gate went green: it built and kept every test the baseline was holding'
    const markup = renderToStaticMarkup(<Lamp lit reached colour={CALLER} label={sentence} />)
    expect(markup).toContain('role="img"')
    expect(markup).toContain(`aria-label="${sentence}"`)
    // The tooltip stays for the reader who does have a mouse; it is the only-a-tooltip version that
    // was the problem.
    expect(markup).toContain(`title="${sentence}"`)
  })

  it('lights a lamp that says it is lit and not reached, because a lamp cannot be lit without having been reached and the lit fact is the one a build recorded', () => {
    const contradictory = renderToStaticMarkup(
      <Lamp lit reached={false} colour={CALLER} label="lit" />,
    )
    const lit = renderToStaticMarkup(<Lamp lit reached colour={CALLER} label="lit" />)
    expect(contradictory).toBe(lit)
  })

  it('takes no colour of its own from this package, so that no build vocabulary travels with it', () => {
    for (const lamp of [
      <Lamp key="a" lit reached colour={CALLER} label="a" />,
      <Lamp key="b" lit={false} reached colour={CALLER} label="b" />,
      <Lamp key="c" lit={false} reached={false} colour={CALLER} label="c" />,
    ]) {
      const markup = renderToStaticMarkup(lamp)
      expect(markup).not.toContain('var(--state-')
      expect(markup).not.toContain('var(--danger')
      expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    }
  })
})
