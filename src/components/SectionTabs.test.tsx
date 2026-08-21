import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { SectionTabs } from './SectionTabs.js'

const SECTIONS = [
  { href: '/settings/?a=shape', label: 'the shape', current: false },
  { href: '/settings/?a=run', label: 'the run', current: true },
  { href: '/settings/?a=model', label: 'the model', current: false },
]

group('the sections of a page, as a bar across the top of it', () => {
  it('lights the section the reader is on, and says so to a screen reader as well as in colour', () => {
    // Neither original said it in anything but colour. A row that reports where you are only in a
    // background is a row that reports nothing at all to somebody not looking at it.
    const said = renderToStaticMarkup(<SectionTabs tabs={SECTIONS} label="Settings sections" />)

    expect(said).toContain('aria-current="page"')
    expect(said.match(/aria-current="page"/g)?.length).toBe(1)
    expect(said).toContain('background:var(--state-selected-bg)')
  })

  it('names the row, because a page with more than one nav in it needs both named', () => {
    const said = renderToStaticMarkup(<SectionTabs tabs={SECTIONS} label="Settings sections" />)

    expect(said).toContain('aria-label="Settings sections"')
  })

  it('pushes a departure to the right, because a thing that watches the run is not a setting', () => {
    // Both versions wrote this margin and both wrote down the same argument for it, which is most of
    // the reason the pair was worth settling.
    const said = renderToStaticMarkup(
      <SectionTabs
        tabs={SECTIONS}
        trailing={[{ href: '/settings/?a=supervisor', label: 'the supervisor', current: false }]}
        label="Settings sections"
      />,
    )

    expect(said).toContain('margin-left:auto')
    expect(said.match(/margin-left:auto/g)?.length).toBe(1)
  })

  it('keeps the auto margin on the first departure only, so several stay together at the right', () => {
    const said = renderToStaticMarkup(
      <SectionTabs
        tabs={SECTIONS}
        trailing={[
          { href: '/overwatch/', label: 'the supervisor', current: false },
          { href: '/chat/', label: 'ask', current: false },
        ]}
        label="Settings sections"
      />,
    )

    expect(said.match(/margin-left:auto/g)?.length).toBe(1)
  })

  it('lights a departure that is the section being read, which is where the two versions differed', () => {
    // The other one never lights a departure, on the grounds that lighting it would claim the reader
    // is already there. That holds for a link off the page and fails for a section of this one
    // wearing a divider, which is what this arrangement was taken from. A caller who wants the other
    // behaviour passes `current: false`.
    const said = renderToStaticMarkup(
      <SectionTabs
        tabs={SECTIONS.map((tab) => ({ ...tab, current: false }))}
        trailing={[{ href: '/settings/?a=supervisor', label: 'the supervisor', current: true }]}
        label="Settings sections"
      />,
    )

    expect(said).toContain('aria-current="page"')
    expect(said).toContain('background:var(--state-selected-bg)')
  })
})
