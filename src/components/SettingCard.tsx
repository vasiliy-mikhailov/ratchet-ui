import type { ReactNode } from 'react'

import { Account } from './Account.js'
import type { Style } from './style.js'

export type SettingCardProps = {
  title: string
  /**
   * WHERE THE VALUE CAME FROM: "currently 4", "the environment's", "the code's own", "not set".
   *
   * This is the part of the card worth copying deliberately, and both dashboards had reached it
   * independently under two names. A value on a settings page is ambiguous until you know whether
   * it came from the environment, from the code's default, or from somebody typing it here, and the
   * reader's next action differs for all three. Saying it in the heading costs a word and removes
   * the question.
   */
  provenance?: string
  /**
   * SOMEBODY HAS OVERRIDDEN THIS, and the card picks its own accent from it.
   *
   * THIS PROP IS ENTIRELY THE OTHER DASHBOARD'S and is here because the settings page that needed
   * it cannot be built without it. One of the two consumers has a settings page that only reads,
   * and so has no opinion about what an edited card looks like; the one that writes had already
   * decided, and had written down why the accent is `--accent-primary` rather than a state colour:
   * having edited a setting is an interaction fact, not something the record decided.
   *
   * A BOOLEAN, never a `kind` and never a `className`. The fact is "changed"; the colour is chosen
   * here, where a test can look at it.
   */
  changed?: boolean
  /**
   * The scroll target, for a save that redirects to an anchor.
   *
   * Also the other dashboard's, and for the same reason: a page that can save is a page that has
   * somewhere to send you afterwards.
   */
  id?: string
  /** What this setting does, in prose, at reading size. */
  children: ReactNode
  /** Under the card rather than in it: when a change takes effect, and what it does not do. */
  footnote?: ReactNode
}

const CARD: Style = {
  border: '1px solid var(--border-soft)',
  borderRadius: '8px',
  background: 'var(--bg-card)',
  padding: '14px 16px',
}

/**
 * The edited card, which differs by a wash and a left rule and by nothing else.
 *
 * TWO SIGNALS RATHER THAN ONE, because either alone is a colour difference a reader has to be told
 * about. The rule gives the card an edge the others do not have, so a column of cards shows which
 * one was touched at a glance rather than on inspection.
 */
const CARD_CHANGED: Style = {
  ...CARD,
  borderLeft: '2px solid var(--accent-primary)',
  background: 'var(--accent-soft)',
}

const TITLE: Style = { fontWeight: 600, fontSize: '13px' }

const PROVENANCE: Style = {
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  color: 'var(--text-tertiary)',
  marginLeft: '8px',
}

/** The provenance of a card somebody edited says so in the accent rather than in a second word. */
const PROVENANCE_CHANGED: Style = { ...PROVENANCE, color: 'var(--accent-primary)' }

/**
 * ONE SETTING, IN THE CARD BOTH DASHBOARDS SHOW ONE IN.
 *
 * The two versions were a card and a row, and the pairing between them is exact rather than
 * approximate: `title` against `name`, `provenance` against `state`, both drawn as a small
 * uppercase letterspaced tertiary word beside the heading, at 10px and 10.5px respectively. The
 * markup, the metrics and the prop names here are the card's, per the rule this release follows.
 * The two optional props are the row's, they default off, and a caller that omits them gets the
 * card byte for byte as it was.
 *
 * THE FOOTNOTE IS A QUIET {@link Account} AND NOT A PRIVATE STYLE. The five declarations it used to
 * carry are the same five, so the note under a card and the note under a control are now one thing
 * that can only be restyled once.
 */
export function SettingCard({
  title,
  provenance,
  changed = false,
  id,
  children,
  footnote,
}: SettingCardProps) {
  return (
    <>
      <section id={id} style={changed ? CARD_CHANGED : CARD}>
        <h3 style={{ margin: '0 0 8px' }}>
          <span style={TITLE}>{title}</span>
          {provenance === undefined ? null : (
            <span style={changed ? PROVENANCE_CHANGED : PROVENANCE}>{provenance}</span>
          )}
        </h3>
        {children}
      </section>
      {footnote === undefined ? null : <Account quiet>{footnote}</Account>}
    </>
  )
}
