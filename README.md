# ratchet-ui

The parts of an agent-pipeline dashboard that do not move at UI speed: the shapes a backend serves,
the runtime checks that say whether it really served them, and a token contract that names what a
component needs without deciding what colour it is.

Apache 2.0. No dependencies. No React.

```
pnpm add ratchet-ui
```

## Why this exists

Two tools grew the same dashboard twice. Both work a queue with an agent chain, both write a
`settlements.jsonl`, both serve a list of work items, an item with its recorded events, findings
from a supervising pass, and a manifest so a shell can mount them side by side. Neither knew what
the other had called any of it.

The duplication that hurts is not the components. Components are cheap to write twice and they are
supposed to differ, because the two tools are showing different things. What is expensive to have
twice is the part where the two must agree: the vocabulary, and whether a given server actually
speaks it. That is what is in here, and nothing else is.

## What ships

| File | What it is |
| --- | --- |
| `src/wire.ts` | The six documents an agent pipeline serves, as types. No imports, no runtime. |
| `src/check.ts` | Hand-written validators returning a list of problems, never throwing. |
| `src/tokens.css` | The custom-property names a component may reference, with placeholder values. |
| `src/style.ts` | Adding CSS custom properties to a style object without depending on React. |
| `tsconfig.base.json` | The compiler settings both consuming repositories already had, byte for byte. |

## The types are only half of a contract

A type is a promise between two compilers. It says nothing about the bytes a running server sends,
and that gap is where the interesting failures live: a field typed `string | null` that arrives
absent, a count that arrives as the string `"0"`, a nav item naming a badge the manifest does not
define. All three type-check, because by the time the JSON is parsed the types are gone.

So every shape has a validator, and the validators are how a backend proves it serves the contract:

```ts
import { checkWorkItems, describe } from 'ratchet-ui'

const problems = checkWorkItems(await (await fetch('/api/items')).json())
expect(describe(problems)).toBe('no problems')
```

They return problems rather than throwing, they report every problem rather than the first, and
they never throw on any input including the ones you would pass from a `catch`.

The rule they exist for is that **`null` and absent are different**. `null` means the server has
nothing to say yet and the page draws a blank. A missing key means the server forgot the field. A
page cannot tell them apart after `JSON.parse`, and the version that gets shipped is the one where a
running item draws an empty cell with the separators still around it.

## States are strings, deliberately

The one design decision worth arguing about. `State`, `Verdict` and `EventKind` are `string`, not
unions of everything both pipelines use, because these vocabularies are not read by TypeScript. They
are read by shell scripts, with `grep`, against the settlement record on disk:

```sh
# one pipeline's runner
grep -qvE '"state":"(bumping|requeued)"'

# the other's
DISPOSITIONS='"state":"(false-positive|by-design|unprovable|reproduced|needs-review|...)"'
```

Same filename, same field, disjoint vocabularies, and neither can move: a token added to one
project's union and not to its shell script produces an item that is finished on the page and
unfinished to the loop that is supposed to stop working on it. Silently, and it costs a lane.

So the wire says `string`, and each project keeps its own union and proves assignability on its own
side in one line:

```ts
import type { State } from 'ratchet-ui/wire'

type Verdict = 'PASS' | 'FAIL_build_post' | 'queued'
const _assignable: State = 'PASS' satisfies Verdict
```

Each project gets the exhaustive union it can switch over. The shared type stays true.

## The token contract carries no palette

`src/tokens.css` is a list of twenty-three custom-property **names**. The values in it are a
deliberately drab grey ramp, chosen for this file, belonging to nobody. They are there so an
unthemed consumer sees something legible and a component's tests have something to compute against,
and they are chosen to look unfinished on purpose. A default that looked good would get shipped by
somebody in a hurry, and this package would have made a design decision for a product it knows
nothing about.

This is a licence position as much as a design one. A palette usually belongs to somebody: a design
system, an employer, a product with a brand. Copying one into a shared library is how a colour with
an owner ends up in a dozen repositories that have no right to it. **No product's palette is ever
added to this file** — not as a default, not as a theme, not as an example. A component that needs a
colour it does not have gets a new *name* here, never somebody's value.

Override by importing first and defining the same names afterwards. Later wins at equal specificity:

```css
@import 'ratchet-ui/tokens.css';

:root {
  --bg-canvas: /* your value */;
  --accent-action: /* your value */;
}

.dark {
  --bg-canvas: /* your dark value */;
}
```

Overriding every name is the expected case. A consumer whose tokens are declared under a licence
that does not permit redistribution should keep them exactly where they are; supporting that is what
this arrangement is for.

Dark theme switches on `.dark` at the root rather than `prefers-color-scheme`, because a dashboard
mounted inside a shell has to follow the shell's choice and the shell needs something it can set.

## What is deliberately not here

**No React components, and not even React as a peer dependency.** This is the part most likely to
look like unfinished work, so here is the reason in full.

A component that renders a Tailwind utility class only works if Tailwind emitted that class, and
Tailwind emits classes it finds by scanning the globs a project declares with `@source`. Both
consuming projects scan exactly two: their own `app` directory and their own `packages/ui/src`. A
component moved into `node_modules` is inside neither. The utility silently stops being emitted, and
the component renders with **no error, no warning and no failing test** — in the case that prompted
this, a pulsing status dot that simply stopped pulsing.

That failure is invisible to CI, which is exactly why it is not worth risking to ship a button
early. Components can move here later, once the `@source` question has a tested answer. Version
0.1.0 ships the part that has no such trap in it.

**No schema library.** The validators are hand-written because a schema dependency here is a version
negotiation with everybody who adopts this. More code in this repository, none in yours.

**No settings, no theme switcher, no data fetching.** Those move at UI speed. This package is for
the parts that do not.

## Adopting it

Nothing here requires a rewrite. The manifest and health shapes are already served field for field
by both pipelines and cost nobody a rename. The rest is a request rather than an instruction, and
[ADOPTING.md](ADOPTING.md) is that request written out: what a tool would rename, what it would keep,
and which parts are worth taking on their own even if the rest is declined.

## Development

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

There is no host Node requirement beyond version 22. CI runs the same four commands, because a build
that only works on the author's machine is the one thing a shared package must not be.
