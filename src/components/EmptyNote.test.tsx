import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { EmptyNote } from './EmptyNote.js'

/**
 * The two dashboards drew this differently and the difference is the only thing worth asserting: an
 * inline italic line against a block with forty-eight pixels of padding above and below it. Sharing
 * one of them changes what the other's pages look like, so the shape is pinned here rather than left
 * to whoever edits the file next.
 */
group('the empty note', () => {
  it('states the emptiness on one inline italic line rather than in a page-sized block', () => {
    const markup = renderToStaticMarkup(<EmptyNote>{'nothing yet'}</EmptyNote>)
    expect(markup.startsWith('<p')).toBe(true)
    expect(markup).toContain('font-style:italic')
    expect(markup).toContain('margin:10px 0')
  })

  it('renders only the sentence the screen wrote, because a default sentence is shown on the one screen nobody wrote copy for', () => {
    const markup = renderToStaticMarkup(<EmptyNote>{'no bumps have settled yet'}</EmptyNote>)
    expect(markup.replace(/<[^>]*>/g, '')).toBe('no bumps have settled yet')
  })

  it('takes its colour from the contract rather than naming a grey', () => {
    expect(renderToStaticMarkup(<EmptyNote>{'x'}</EmptyNote>)).toContain('color:var(--text-tertiary)')
  })
})
