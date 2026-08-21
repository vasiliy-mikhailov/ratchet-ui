import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { Account } from './Account.js'

group('a paragraph explaining what a control does', () => {
  it('measures itself, because the page it sits on has no centred column to do it', () => {
    expect(
      renderToStaticMarkup(<Account>How many repositories are bumped at the same time.</Account>),
    ).toContain('max-width:72ch')
  })

  it('leaves the colour to the page, so the paragraph a reader must read is body text', () => {
    expect(renderToStaticMarkup(<Account>Every comma is mandatory.</Account>)).not.toContain(
      'color:',
    )
  })

  it('sets the aside smaller and quieter while keeping the same measure', () => {
    const said = renderToStaticMarkup(<Account quiet>Takes effect at the next round.</Account>)

    expect(said).toContain('color:var(--text-tertiary)')
    expect(said).toContain('max-width:72ch')
    expect(said).toContain('font-size:11.5px')
  })

  it('takes markup, because these sentences carry emphasis and interpolated values', () => {
    expect(
      renderToStaticMarkup(
        <Account>
          <strong>Every comma is mandatory.</strong> Between {1} and {16}.
        </Account>,
      ),
    ).toContain('<strong>Every comma is mandatory.</strong>')
  })
})
