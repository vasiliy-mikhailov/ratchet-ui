import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { SettingCard } from './SettingCard.js'

/**
 * THE TWO VERSIONS OF THIS WERE A CARD AND A ROW, and the assertions below are the places they
 * differed: the inset, the size of the provenance word, the left rule, and whether an unedited card
 * carries an accent at all. Everything else about the two was the same fact written twice.
 */
group('one setting, in a card', () => {
  it('says where the value came from beside the title rather than leaving a reader to guess', () => {
    const said = renderToStaticMarkup(
      <SettingCard title="parallel lanes" provenance="currently 4">
        <p>how many repositories are bumped at once</p>
      </SettingCard>,
    )

    expect(said).toContain('parallel lanes')
    expect(said).toContain('currently 4')
    // Small, uppercase and tertiary: it labels the value, and a label that competes with the title
    // is a second title.
    expect(said).toContain('font-size:10px')
    expect(said).toContain('text-transform:uppercase')
  })

  it('draws no accent on a card nobody has edited, because most pages never edit one', () => {
    // One consumer's settings page only reads. A card that arrived wearing an override colour would
    // be telling that page's readers about a state it does not have.
    const said = renderToStaticMarkup(
      <SettingCard title="the endpoint" provenance="the environment's">
        <p>read at launch</p>
      </SettingCard>,
    )

    expect(said).toContain('background:var(--bg-card)')
    expect(said).not.toContain('--accent-primary')
    expect(said).not.toContain('--accent-soft')
  })

  it('accents a card somebody has overridden, in the edge as well as in the wash', () => {
    // Two signals rather than one: a wash alone is a colour a reader has to be told the meaning of,
    // and the rule gives the edited card an edge the others in the column do not have.
    const said = renderToStaticMarkup(
      <SettingCard title="parallel lanes" provenance="edited" changed>
        <p>somebody has changed this</p>
      </SettingCard>,
    )

    expect(said).toContain('border-left:2px solid var(--accent-primary)')
    expect(said).toContain('background:var(--accent-soft)')
    // And the provenance word goes with it, so the accent has something to mean.
    expect(said).toContain('color:var(--accent-primary)')
  })

  it('puts the note under the card rather than inside it, at the size of a thing to look up', () => {
    const said = renderToStaticMarkup(
      <SettingCard title="parallel lanes" footnote="Takes effect at the start of the next round.">
        <p>how many</p>
      </SettingCard>,
    )

    expect(said).toContain('</section><p')
    expect(said).toContain('font-size:11.5px')
    expect(said).toContain('color:var(--text-tertiary)')
    // The same measure as any other paragraph on the page: the note is prose, not a caption.
    expect(said).toContain('max-width:72ch')
  })

  it('takes an anchor, so a save can send the reader back to the card it changed', () => {
    const said = renderToStaticMarkup(
      <SettingCard title="the markers" id="markers">
        <p>the queue</p>
      </SettingCard>,
    )

    expect(said).toContain('id="markers"')
  })

  it('leaves the anchor and the provenance off entirely when it was given neither', () => {
    // Not an empty id and not an empty word: an `id=""` is a target a browser can be sent to.
    const said = renderToStaticMarkup(
      <SettingCard title="the subject">
        <p>the queue this sweep is working through</p>
      </SettingCard>,
    )

    expect(said).not.toContain('id=')
    expect(said).not.toContain('font-size:10px')
  })
})
