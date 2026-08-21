import { defineConfig } from 'vitest/config'

/**
 * NODE ENVIRONMENT, DELIBERATELY, EVEN NOW THAT THINGS RENDER.
 *
 * The components under `src/components` are asserted through `renderToStaticMarkup`, which produces
 * the same string a server produces and needs no DOM at all. A simulated browser would cost seconds
 * on every run to emulate an environment none of these components can tell is there: they hold no
 * state, attach no handler, and read nothing off the document. The day one of them does, it will not
 * belong in this package, because a component that behaves differently in the two consuming
 * dashboards is not a shared component.
 *
 * THREE FILES ARE THE EXCEPTION AND SAY SO ON THEIR FIRST LINE, with a `@vitest-environment
 * happy-dom` comment. `useAsk` is a hook, and a hook cannot be rendered to a string; `Loaded` and
 * `Section` are components whose tests moved here verbatim rather than being rewritten, because
 * those tests are the record of eighteen copies of one branch and a rewrite would have kept the
 * assertions and lost the reasoning. The paragraph above still holds for everything else and is the
 * reason those three are named individually rather than the whole run being moved into a browser.
 *
 * `globals: true` IS LOAD-BEARING AND NOT A CONVENIENCE. Testing Library registers its automatic
 * cleanup through the global `afterEach`, and with globals off it never registers at all: the DOM is
 * not reset between cases, a second render leaves the first one standing, and the failure surfaces
 * three files away as "found multiple elements" in whichever test happens to query by text last. It
 * was run both ways to establish that.
 *
 * `.tsx` is included as well as `.ts`, and its absence was a silent hole rather than a typo: a
 * component test under a pattern that only matched `.ts` was simply never collected, and the run
 * reported a green suite with the file missing from it.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
