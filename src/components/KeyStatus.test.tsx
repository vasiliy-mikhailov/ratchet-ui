import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { KeyStatus } from './KeyStatus.js'

group('whether the endpoint has a key, and whose', () => {
  it('says where the key came from in the calling page’s own words', () => {
    // One consumer has exactly one answer to this and the other has two, which is why the source is
    // a string the caller supplies rather than a union this component keeps.
    expect(
      renderToStaticMarkup(<KeyStatus keyed keySource="the environment" whenAbsent="refused" />),
    ).toContain('the agents are using the key from the environment')
  })

  it('lets each page say what having no key means there, because the two pages disagree', () => {
    // A page that can set a key and a page that deliberately cannot are answering different
    // questions, and both wrote their answer down as a policy rather than drifting into it.
    const cannotSet = renderToStaticMarkup(
      <KeyStatus
        keyed={false}
        keySource="the environment"
        whenAbsent="every agent call will be refused until one is set on the container"
      />,
    )
    const canSet = renderToStaticMarkup(
      <KeyStatus
        keyed={false}
        keySource="this page"
        whenAbsent="nothing is set here and nothing is set in the environment"
      />,
    )

    expect(cannotSet).toContain('one is set on the container')
    expect(canSet).toContain('nothing is set here')
    expect(cannotSet).not.toContain('the agents are using the key from')
  })

  it('reads the pill off whether there is a key at all, and both versions already agreed', () => {
    // "key set" and "no key", good and alarm. Identical in both repositories before this move, which
    // is what made the pair worth settling.
    expect(renderToStaticMarkup(<KeyStatus keyed keySource="this page" whenAbsent="x" />)).toContain(
      'key set',
    )
    expect(
      renderToStaticMarkup(<KeyStatus keyed={false} keySource="this page" whenAbsent="x" />),
    ).toContain('no key')
  })

  it('sets the source sentence at reading size beside the pill rather than as an aside beneath it', () => {
    // It is the answer to the question the pill raises. A reader just told there is a key is about
    // to ask whose, and an aside two sizes down is where a thing goes when nobody has asked.
    const said = renderToStaticMarkup(
      <KeyStatus keyed keySource="the environment" whenAbsent="x" />,
    )

    expect(said).toContain('font-size:12.5px')
    expect(said).toContain('color:var(--text-secondary)')
  })
})
