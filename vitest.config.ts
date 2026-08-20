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
 * `.tsx` is included as well as `.ts`, and its absence was a silent hole rather than a typo: a
 * component test under a pattern that only matched `.ts` was simply never collected, and the run
 * reported a green suite with the file missing from it.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
