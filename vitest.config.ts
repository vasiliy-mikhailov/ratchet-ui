import { defineConfig } from 'vitest/config'

/**
 * Node environment, deliberately. Nothing in this package touches a DOM, because nothing in this
 * package renders: it is types, validators and a stylesheet. Running these tests in a simulated
 * browser would cost seconds per run to simulate an environment none of the code under test can
 * tell is there.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
