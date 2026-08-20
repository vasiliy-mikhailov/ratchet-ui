/**
 * THE COMPONENTS, AND WHY THEY ARE ON A SUBPATH OF THEIR OWN.
 *
 * Everything here renders, so everything here needs React. The root entry of this package does not,
 * and must not: a consumer that wants `ratchet-ui/wire` for its server or `ratchet-ui/check` for a
 * test should never have to resolve a React version to get them. Keeping the components behind
 * `ratchet-ui/components` is what makes that true by construction rather than by care.
 *
 * WHAT QUALIFIES ONE OF THESE TO BE HERE. Both consuming dashboards had written it, and the
 * difference between their two versions was the palette rather than the behaviour. That rule is
 * narrower than it sounds and it excluded more components than it admitted: two versions of the
 * same fold, one of which remembers whether the reader opened it, are not one component written
 * twice, and the one that remembers would be deleted by sharing.
 *
 * NONE OF THESE CARRIES A COLOUR. Every colour is a custom property the consumer defines, listed in
 * `tokens.css`, and a component reaching for a name the contract does not promise fails
 * `tokens.test.ts` rather than rendering invisibly.
 */

export { EmptyNote, type EmptyNoteProps } from './EmptyNote.js'
export {
  CORNER,
  CORNER_BUSY,
  CORNER_BUTTON,
  CORNER_MARK,
  CORNER_REFUSED,
  HEADER_NOTE,
  PageHeader,
  type Crumb,
  type PageHeaderProps,
} from './PageHeader.js'
export { Pill, type PillProps, type PillTone } from './Pill.js'
export { ProgressBar, type ProgressBarProps } from './ProgressBar.js'
export type { Style } from './style.js'
export { STRIP, Tally, type TallyProps } from './Tally.js'
