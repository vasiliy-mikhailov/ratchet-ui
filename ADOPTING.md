# Adopting ratchet-ui

This is a request, not an instruction. There are two of them in here and they are independent.

**Part one, the components**, is new in 0.2.0 and is why this document was reopened. Five files leave
your `packages/ui/src` and come back as imports. It is the part with a real cost, and the cost is
written out below rather than summarised.

**Part two, the wire vocabulary**, is unchanged from 0.1.0 and is further down.

---

# Part one: the five components

## What is being asked, and on whose authority

Five components move to `ratchet-ui/components`, and in every case the shared implementation is
`bump-java-version`'s file rather than yours:

| Yours | Becomes |
| --- | --- |
| `packages/ui/src/primitives/EmptyNote.tsx` | `import { EmptyNote } from 'ratchet-ui/components'` |
| `packages/ui/src/primitives/Pill.tsx` | `import { Pill } from 'ratchet-ui/components'` |
| `packages/ui/src/primitives/ProgressBar.tsx` | `import { ProgressBar } from 'ratchet-ui/components'` |
| `packages/ui/src/primitives/Tally.tsx` | `import { STRIP, Tally } from 'ratchet-ui/components'` |
| `packages/ui/src/primitives/style.ts` | `export type { Style } from 'ratchet-ui/components'` |
| `packages/ui/src/domain/PageHeader.tsx` | `import { CORNER, PageHeader } from 'ratchet-ui/components'` |

That bump-java-version's version wins every difference is the repository owner's decision, taken
before this work started, and it is not a judgement that its files are better written. Where your
version had something the shared one does not, this document says so and says what losing it costs
you. Two of the five change what your pages do. Three do not change anything at all.

The colours do not travel. `ratchet-ui`'s own `tokens.css` is thirty-three property NAMES with a
deliberately drab achromatic ramp chosen for that package and belonging to nobody, and the package
would rather grow a name than take a value. Your palette stays in your `domain.css`, in your
repository, under your licence. Ten aliases connect the two, and eight of the ten reproduce a map
your own code already holds.

## The eleven that are not being asked for, and why

Sixteen pairs were compared with comments stripped. The rule was not size: a large diff is fine if
the two are the same component written differently. The disqualifying question was whether YOUR
version does something the other structurally cannot, because forcing the other one on you would
then delete something you built on purpose. Ten did, and they stay where they are:

| Yours | What it does that the other cannot |
| --- | --- |
| `RelativeTime` | `'use client'`, owns a timer whose interval slows as the reading coarsens, required `variant` where `stream` reports silence, `suppressHydrationWarning` for a static export. The other is a pure function taking a caller-supplied `now`. Different capabilities in both directions. |
| `TabRow` | `trailing`, departures pushed right and never lit whatever `on` says. A flat `<nav>` gives no call site a way to put the auto margin back. |
| `SaveRow` | The destructive twin that arms before it fires, three-state, `onConfirm`. The other has one intent. |
| `Disclosure` | Controlled, plus a required stable `id` carried by the thing being disclosed rather than by its position. The other is an uncontrolled `<details>` that snaps shut on a poll. |
| `TextFold` | A character ceiling as well as a line count, a stable `id`, nothing at all for an empty body, the size in the label. |
| `CodeBlock` | Lexes Java in one alternation, `matchAll` for re-entrancy, `language` so colouring something the lexer cannot read stops being silent. |
| `LabeledField` | Owns the input: `useId` for the label association and `aria-describedby` for the help. The other wraps `children` and cannot know the control's id. |
| `VerdictPill` | Typed to a three-member `Verdict` against the other's twelve, and deliberately not routed through `Pill` so the marker vocabulary is not re-borrowed. No shared type exists. |
| `EventFeed` | `order`, copies before sorting, publishes a live-tail cursor, delegates rows to `TraceEvent` with `content-visibility: auto`. Same name, different component. |
| `ChainStrip` | Navigation: `current`, `aria-current`, marker hrefs. The other is a read-only filter strip. Two designs, not two drafts. |

The eleventh, `style.ts`, is in the move list and is the one place where there is nothing to weigh:
your file and the other are the same two lines and differ only in which token their prose quotes.

## Installing it

In `packages/ui/package.json`, which is where the components are:

```json
"dependencies": {
  "@fsm/types": "workspace:*",
  "ratchet-ui": "github:vasiliy-mikhailov/ratchet-ui#v0.2.0"
}
```

React stays yours. `ratchet-ui` declares `"react": ">=19"` as a **peer**, never a dependency, and
your workspace pins 19.2.3, so nothing about your React resolution changes. The root entry of the
package still reaches no React at all: only `ratchet-ui/components` does.

There is nothing else to configure, and this was measured rather than reasoned about. No
`transpilePackages` in `next.config`: the package ships compiled ESM with an exports map, `'use
client'` survives `tsc` as a directive prologue above the JSX-runtime import, and a client component
imported from the installed package compiled and shipped into a browser chunk with no config change.
No `onlyBuiltDependencies` allowlist and no build step, because a release tag carries its own `dist`.

Two things will bite if you do them in the wrong order:

- **The lockfile is the second file and it must move in the same commit.** Changing only
  `package.json` gives you `ERR_PNPM_OUTDATED_LOCKFILE` under `--frozen-lockfile`, which is the gate
  working and is what your deploy script will die on.
- **A git reference must be a TAG.** A short commit sha fails at resolution: `Could not resolve
  c364019 to a commit of …`.

An unsatisfiable peer is only a warning by default: pnpm 10 prints `WARN Issues with peer
dependencies found` and exits 0, so a `set -euo pipefail` deploy script sails straight past it. If
you want that to be a gate, `strict-peer-dependencies=true` in your `.npmrc` turns it into
`ERR_PNPM_PEER_DEP_ISSUES` with a non-zero exit. It fires only when resolution runs, which is the
right moment: an up-to-date lockfile skips the check, and the lockfile is rewritten exactly when a
peer range can change.

## The one line your build needs, and it fails silently without it

`Pill` renders `className="animate-pulse"` on the dot that marks a moving row. It is the only
Tailwind utility class in either repository's `packages/ui`. Your `apps/web/app/globals.css` scans
exactly two globs:

```css
@source "../app";
@source "../../../packages/ui/src";
```

Neither covers `node_modules`. Move `Pill` there and Tailwind stops emitting the utility, the dot
stops pulsing, and **nothing fails**. This was reproduced end to end on a copy of the sibling's tree,
with `Pill` packed into a real tarball and installed by pnpm: the build succeeded, all 118 tests
passed, and `.animate-pulse` and `@keyframes pulse` were both gone from the built stylesheet. It is
worse than it sounds, because the class is not in the exported HTML either. A running pill only
exists at run time from fetched data, so there is nothing at build time to notice.

Add one line, under the one you already have:

```css
@source "../../../packages/ui/node_modules/ratchet-ui/dist";
```

Two things about that path, both measured and both silent when wrong:

- **`@source` resolves relative to the STYLESHEET, not to the project root.** That is why your
  existing line starts with three `../`. The obvious `../../node_modules/ratchet-ui/…` points at
  `apps/node_modules`, which does not exist, and Tailwind does not warn about a glob that matches
  nothing.
- **`dist`, not `src`.** pnpm honours `files` when installing a git dependency, and `files` ships
  `dist` plus `src/tokens.css` and nothing else, so a glob at `src` scans one stylesheet and finds no
  class, silently and in exactly the same way. `tsc` emits the class as a string literal
  (`_jsx("span", { className: "animate-pulse", … })`), so the built file scans correctly. Tailwind
  follows the pnpm symlink into `node_modules/.pnpm` without complaint.

Then check it, because a silent failure needs a check rather than a comment. After a static export:

```sh
grep -o '\.animate-pulse{[^}]*}' apps/web/out/_next/static/chunks/*.css
```

Note the directory: Next 16 writes the stylesheet to `static/chunks/`, not `static/css/`. That grep
belongs in whichever CI you have; nothing in `ratchet-ui`'s own CI can catch this, because the
failure is in the consumer's build.

## The custom properties you define

Ten names, all in your `packages/ui/src/domain.css`, in the `:root` block. Eight of them reproduce a
map your own code already holds, so nothing changes colour:

```css
:root {
  /* Pill's TONE record, moved out of TypeScript into the file that already decides what a
     disposition looks like. Same six pairs, same colours. */
  --state-good: var(--state-verified-pr-ready);
  --state-warn: var(--state-needs-review);
  --state-quiet: var(--state-false-positive);
  --state-alarm: var(--state-infra);
  --state-running: var(--state-proving);
  --state-aside: var(--state-by-design);

  /* ProgressBar's gradient, unchanged. */
  --state-progress-from: var(--state-proving);
  --state-progress-to: var(--state-verified-pr-ready);

  /* NEW, and nothing renders them until you pass Tally a tone. A count that MOVED is not a
     disposition, which is the same distinction FindingsButton draws when it insists on
     `--verdict-holds` over `--state-needs-review`, so these point at the supervisor's vocabulary
     rather than at a marker's. Change them if you disagree; nothing else reads them. */
  --state-count-good: var(--verdict-holds);
  --state-count-alarm: var(--verdict-refuted);
}
```

**`:root` only, not `.dark`.** These are aliases of names your `.dark` block already redefines, and
custom-property substitution resolves against the computed value on the element, so `--state-good`
declared once follows the theme on its own. Your `--step`-style aliases already work this way.

## Component by component

### `style.ts`, and it costs nothing

Two lines both sides, identical apart from which token the prose quotes. Replace the body with a
re-export so your twenty-odd `import type { Style } from './style'` lines do not move:

```ts
export type { Style } from 'ratchet-ui/components'
```

The shared type is `WithTokens<CSSProperties>`, which expands to exactly what you have today.

### `ProgressBar`, and nothing changes

Identical markup, identical ARIA down to `aria-label="settled"`, identical deliberate non-clamping,
identical `overflow: hidden` comment. The entire difference was the gradient's two token names, and
the two aliases above restore them. Your one call site changes by zero characters.

### `Tally`, and you gain two things

The shared version is a strict superset: `tone?: 'plain' | 'good' | 'alarm'`, defaulting to `plain`.
All fifteen of your call sites are already the default, and `plain` resolves to
`var(--text-primary)`, which is what your `body` already sets, so the colour on the page does not
move.

`FindingTally` is the obvious customer for the tone it adds: `holds`, `unjudged`, `refuted`.

You also gain `STRIP`, which you currently keep as two byte-identical private copies:
`domain/RunProgress.tsx:42` and `domain/StateCounts.tsx:20`, both
`{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '14px 24px' }`. Import one instead. Note
that `FindingTally`'s own `STRIP` is a different object (`margin: '12px 0'`, no page gutter) and
should stay private.

What you lose: the doc comment explaining why your markers page carries two adjacent strips. That is
a fact about that page, not about a shared primitive, and `StateCounts.tsx:35` already says it.

### `Pill`, and you gain `title`

Same six tones, same names, same `--pill-tone` set-once-read-three-times, same `color-mix` 14 per
cent wash and 32 per cent edge, same pulsing dot, same position on why a tone may never arrive over
the wire. The whole diff was the TONE map's right-hand column, plus `title?: string`, which the
shared version has and yours does not. Your seven call sites change by zero characters.

`VerdictPill` currently hand-rolls `title={MEANS[verdict]}` on a bare span. It is staying where it
is, deliberately and for the reason its own comment gives, but if you ever want it to route through
`Pill` after all, `title` is now there.

### `EmptyNote`, and this one changes what your pages look like

This is the pair where neither version can do anything the other cannot, so the rule handed it to the
sibling, and you will see it. Yours is a `<div>` with `padding: 48px 24px`. The shared one is an
italic `<p>` at 12.5px with `margin: 10px 0`. Twenty-seven call sites.

Most of them are inline notes beside content, where a compact italic line reads better than a
48-pixel block. A handful are genuine whole-page empty states, `app/page.tsx` and `marker/page.tsx`
among them, and those will get visibly tighter. Re-adding the roomy version is a wrapper at those
call sites, not a prop:

```tsx
<div style={{ padding: '48px 24px' }}>
  <EmptyNote>{'a quiet page is a good sign'}</EmptyNote>
</div>
```

What did survive is your argument: the shared component has no default copy either, and takes only
`children`. The reasoning you wrote, that a default sentence is the one shown on the screen nobody
wrote copy for, is in the shared file's comment, because it is the thing most likely to be undone by
somebody who has not read it.

### `PageHeader`, the most valuable item and the one that changes your API

`HEADER`, `TITLE`, `SUB`, `CRUMB` and `ACTIONS` are identical between the two repositories,
declaration for declaration, with comments stripped. Your private `GEAR` is the shared `CORNER`, same
six declarations in the same order. Both reached `subtitle: ReactNode` independently. There is
nothing to reconcile in the layout at all.

The difference is the corner. Yours hard-codes `FindingsButton`, `/chat` and `/settings` and takes a
required `findingsOpen: number`. The shared one takes `actions?: ReactNode`, and since yours renders
that `<div style={ACTIONS}>` unconditionally, a caller that always passes something produces
byte-identical DOM.

Add one component in your own domain tier and the twenty-one renders across six files become a prop
rename:

```tsx
import { CORNER } from 'ratchet-ui/components'
import { FindingsButton } from './FindingsButton'

/** The three corner controls every screen wears. Was PageHeader's body; is now its caller's. */
export function Corner({ open }: { open: number }) {
  return (
    <>
      <FindingsButton open={open} />
      <a href="/chat" style={CORNER} title="ask the supervisor" aria-label="ask the supervisor">
        <span aria-hidden="true">{'✉'}</span>
      </a>
      <a href="/settings" style={CORNER} title="settings" aria-label="settings">
        <span aria-hidden="true">{'⚙'}</span>
      </a>
    </>
  )
}
```

Then `findingsOpen={data.open}` becomes `actions={<Corner open={data.open} />}` at each site.
`FindingsButton` itself does not move; it is yours, it counts `holds` plus `unjudged`, and nothing
shared has any business knowing that.

What you lose is a discipline rather than a capability. Today no screen CAN forget the three corner
links, because the component supplies them. Afterwards six files each have to pass `actions`, and a
seventh screen written next year can forget. If that matters, keep the guarantee in your own types:
wrap the shared header in a two-line `MarkerPageHeader` of your own whose `open: number` is required
and which passes `<Corner />` itself. That puts you back exactly where you are now, with the layout
shared and the corner enforced, and it is the arrangement this document would recommend.

You also inherit `HEADER_NOTE`, `CORNER_BUTTON`, `CORNER_BUSY`, `CORNER_REFUSED` and `CORNER_MARK`,
the sibling's set-aside control's exports. They are unused by you and cost nothing; `CORNER_BUTTON`
in particular is the button twin of the gear with a reserved transparent border, so a refusal turns
it red without moving the gear beside it by a pixel, and you may want it the next time a corner
control has to do something rather than go somewhere.

## The whole bill, in one place

What you lose:

1. **The roomy empty state**, at whichever of twenty-seven call sites it mattered, until you wrap
   them. This is the only visible change to your pages that is not a straight equivalence.
2. **`PageHeader`'s guarantee** that no screen forgets its corner controls, unless you re-add it in
   your own two-line wrapper as above.
3. **Six files you controlled** become five files on a release schedule you do not set, plus a
   peer dependency and a lockfile entry pinned to a tag.
4. **One doc comment**, `Tally`'s explanation of your two adjacent strips, which already lives in
   the component that draws the second one.

What you gain:

1. `STRIP` once instead of twice, and `Tally`'s `tone`, and `Pill`'s `title`.
2. `HEADER_NOTE` and the four `CORNER_*` styles.
3. A test that fails the build when a shared component reaches for a custom property the contract
   does not promise. That check is why the pill arrived here with contract names rather than with
   somebody else's `--state-pass`.
4. Five files that stop being two copies drifting apart. The pair that prompted all this differed by
   two lines in `ProgressBar` and by nothing at all in `style.ts`.

## The order that keeps every step provable

1. Add the dependency, the `@source` line and the ten aliases. Build. Nothing has changed yet.
2. `style.ts`, `ProgressBar`, `Tally`. Three straight swaps, no visible change, tests stay green.
3. `Pill`. Build, then run the `animate-pulse` grep above. This is the step the whole hazard is
   about, and it is the first point at which the grep proves anything.
4. `EmptyNote`. Look at the two whole-page empty states; wrap them if they need it.
5. `PageHeader` last, because it is the one that touches twenty-one renders.

`bump-java-version` is making exactly this change in the same commit range, so by the time you read
this the five files have one consumer already on them.

## If you decline

Nothing breaks, and a partial yes is a real answer. Steps 1 to 3 above cost you nothing visible and
delete a duplicated `STRIP`; taking those and stopping is a coherent position. So is taking
everything except `PageHeader`, which loses the most valuable item but breaks nothing. So is taking
none of it: the sibling still gets the extraction, and this document was written expecting to be
argued with.

---

# Part two: the wire vocabulary

`ratchet-ui` was extracted from one of the two tools that share this dashboard shape, and the names
in `wire.ts` were chosen by looking at both of them rather than by promoting one. That does not
oblige anybody to adopt them. The types in the other tool were written by reading the Java that
produces them, the odd names in it are odd for reasons, and a maintainer who reads this and decides
the cost is not worth the benefit has read it correctly. Declining is a normal outcome and this
document is written expecting it.

What follows is therefore an honest bill: what adoption costs, what it buys, and which parts are
worth having on their own if the rest is declined.

## Take this part first, because it costs nothing

**`Manifest`, `NavItem`, `Badge` and `Health` are already identical in both tools, field for field.**
They were both written against the same mounting spec, so adopting them is an import and a deleted
type declaration. No rename, no server change, no migration.

That alone is worth doing, and it brings the validators with it. `checkManifest` catches a class of
bug that no type can: a nav item naming a badge the manifest does not define. Every field is the
right type, the shell follows the name, gets `undefined`, polls nothing, and shows no count. Nobody
finds out until somebody notices a number that never appears.

If you adopt nothing else, adopt these four and add one test:

```ts
import { checkManifest, describe } from 'ratchet-ui'

it('serves a manifest a shell can mount', async () => {
  const manifest = await (await fetch('/api/manifest')).json()
  expect(describe(checkManifest(manifest))).toBe('no problems')
})
```

## The renames, if you want the rest

Written from the marker-proving tool's types, since it is the one being asked.

| Yours | Here | Why this name |
| --- | --- | --- |
| `Marker` | `WorkItem` | The shared thing is "a row of the queue". Neither tool's noun generalises. |
| `Marker.id` | `WorkItem.id` | No change. |
| `Marker.state` | `WorkItem.state` | No change, including the type: still a string, still your seven dispositions plus the four unsettled ones. |
| `Marker.summary` | `WorkItem.because` | The one contested rename. See below. |
| `Marker.events` | `WorkItem.events` | No change. |
| — | `WorkItem.at` | New field: epoch ms of the last event. You have the data; it is not currently on the row. |
| `Marker.tookMinutes`, `.attempts`, `.file`, `.line`, `.checker`, `.severity` | stay yours | Genuinely not shared. Extend `WorkItem` rather than pushing these up. |
| `Finding.position` | `Finding.id` | Widened to a string. `String(position)` satisfies it; the stability requirement is the one you already documented. |
| `Finding.markers` | `Finding.items` | Follows `WorkItem`. |
| `Finding.verdict` | `Finding.verdict` | No change. |
| `TraceEvent` | `RecordEvent` | Avoids a collision with the other tool's `TraceEvent`, which is a different shape under the same name. |
| `TraceEvent.agent` | `RecordEvent.agent` | No change, including the `| null`, which was right. |
| `TraceEvent.prompt`, `.reply`, `.args`, `.result`, `.phase`, `.infra`, `.cause`, `.note` | stay yours | The contract has an optional `text` for tools that record one body per line. Yours records two, in full, on purpose. Extending is the correct move here, not flattening. |

### The one contested rename

`summary` to `because` is the only one where the shared name is arguably worse than yours, and it is
worth being straight about why it went that way.

Both fields hold one line explaining an item's state. Yours is the lane interpreter's account,
checked by its critic; the other tool's is the settlement reason. `because` won on two grounds, one
good and one merely practical. The good one: `because` states what the field is *for*, so a server
that has nothing to say writes `null` rather than a plausible-looking sentence, and the null case
stops looking like a bug. The practical one: `summary` already names a different type in the other
tool, and reusing it would have created exactly the collision that `RecordEvent` exists to avoid.

If this is the rename that sinks it, say so. A `summary` alias on `WorkItem` is a smaller change to
this package than a rename is to yours.

## What adoption buys

- **One description of the shape, checked by two test suites.** A change that breaks the other tool
  fails here rather than in production there.
- **Validators for free**, including the null-versus-absent rule that has already shipped as a bug
  once, in the other tool, exactly as the comment in `check.ts` describes.
- **A shell can render both tools' queues with one component.** Not today, since this version ships
  no components, but that is the direction and this is the part that has to exist first.

## What adoption costs

- The renames above, mechanical but not free, across types, the Java that serves them, and the
  pages that read them.
- A dependency on a package maintained by somebody else, on a version schedule you do not set.
- One new field, `at`, on the work-item row.

## What is guaranteed in return

- **Additive changes only.** Adding a field is safe and will happen. Renaming one will not, in
  0.x or later, without a major version and a written migration.
- **No dependencies, ever.** Nothing enters this package's dependency tree without a version
  negotiation with everyone who adopted it, so nothing enters it.
- **Your state vocabulary is never touched.** `State` is a `string` for exactly this reason: the
  shell scripts that grep `settlements.jsonl` are the real authority on what a state is, and this
  package has no business being one of two places that decide. If you ever see a pull request here
  turning `State` into a union, it is wrong and this paragraph is the argument against it.

## If you decline

Nothing breaks. The two tools go on as they are, and the extraction is still worth having for the
one that did it. Take the manifest and health types if you want them and ignore the rest, or take
nothing. This is a request.
