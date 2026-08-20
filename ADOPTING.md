# Adopting the wire vocabulary

This is a request, not an instruction.

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
