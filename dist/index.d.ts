/**
 * ratchet-ui: the parts of an agent-pipeline dashboard that do not move at UI speed.
 *
 * WHAT THIS EXPORTS AND WHAT IT DELIBERATELY DOES NOT.
 *
 * Everything here is a shape, a validator or a type. There are no components, and their absence is
 * a decision rather than a gap in the work. See README.md for the full reasoning, which is short:
 * moving a component into `node_modules` moves it outside the `@source` globs a Tailwind consumer
 * scans, the utility classes it uses silently stop being emitted, and the component renders with no
 * error and no failing test. That failure mode is invisible in CI, which is precisely why it is not
 * worth risking for the sake of shipping a button early.
 *
 * SUBPATHS ARE THE POINT, so prefer them to this file. `ratchet-ui/wire` is types with no runtime
 * whatsoever, so importing from it costs a consumer nothing at all at run time. Importing from here
 * pulls in the validators too. Both are tiny; the distinction still matters, because a types-only
 * dependency is one a consumer never has to think about again.
 */
export type { Badge, EventKind, Finding, Health, ItemDetail, Manifest, NavItem, RecordEvent, State, Verdict, WorkItem, } from './wire.js';
export type { Style, Tokens, WithTokens } from './style.js';
export type { Problem } from './check.js';
export { checkFinding, checkHealth, checkItemDetail, checkManifest, checkRecordEvent, checkWorkItem, checkWorkItems, describe, } from './check.js';
//# sourceMappingURL=index.d.ts.map