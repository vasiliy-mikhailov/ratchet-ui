import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe as group, expect, it } from 'vitest'

/**
 * TESTS ABOUT THE TOKEN CONTRACT, WHICH IS A LIST OF NAMES RATHER THAN A SET OF COLOURS.
 *
 * There is nothing here that asserts a value, and that is the point rather than an omission. A test
 * that pinned `--bg-canvas` to a particular grey would be a test asserting that this package has a
 * palette, and this package deliberately does not have one: the defaults are placeholders, every
 * consumer overrides them, and a test protecting a placeholder would turn the placeholder into the
 * product.
 *
 * What is worth protecting is the shape of the contract. A name defined in the light block and
 * forgotten in the dark one is the failure that motivates most of this file: nothing errors, the
 * cascade simply keeps the light value, and a single element stays bright in a dark interface until
 * somebody notices by eye. There is no other way to catch that.
 */

const here = fileURLToPath(new URL('.', import.meta.url))
const css = readFileSync(join(here, 'tokens.css'), 'utf8')

/** Everything outside a comment, so that a name mentioned in prose is never mistaken for a rule. */
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '')

function block(selector: string): string {
  const found = new RegExp(`${selector.replace('.', '\\.')}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(rules)
  if (found === null) throw new Error(`tokens.css has no ${selector} block`)
  return found[1] ?? ''
}

function definitionsIn(selector: string): string[] {
  return [...block(selector).matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((match) => match[1] ?? '')
}

const light = definitionsIn(':root')
const dark = definitionsIn('.dark')

group('the token contract', () => {
  it('defines its names on :root so that a consumer can override them from an ordinary stylesheet', () => {
    expect(light.length).toBeGreaterThan(0)
  })

  it('defines exactly the same names in dark as in light, because a name missing from one keeps the other value with no error', () => {
    expect([...dark].sort()).toEqual([...light].sort())
  })

  it('defines each name once per block, since a repeated name means the earlier line is dead and misleading', () => {
    expect([...new Set(light)]).toEqual(light)
    expect([...new Set(dark)]).toEqual(dark)
  })

  it('names every token in the functional vocabulary rather than after a colour, so a consumer can rebrand without renaming', () => {
    const colours = /^--(red|green|blue|grey|gray|black|white|orange|yellow|purple|teal|pink)\b/
    expect(light.filter((name) => colours.test(name))).toEqual([])
  })

  it('groups every name under one of the six functional prefixes the header describes', () => {
    const prefixes = ['--bg-', '--text-', '--border-', '--state-', '--focus-', '--accent-', '--danger']
    const strays = light.filter((name) => !prefixes.some((prefix) => name.startsWith(prefix)))
    expect(strays).toEqual([])
  })

  it('switches theme by class rather than by media query, so a shell can decide instead of the operating system', () => {
    expect(rules).toContain('.dark')
    expect(rules).not.toContain('prefers-color-scheme')
  })
})

group('what the package references', () => {
  /**
   * Every `var(--name)` written anywhere in the source, which is the other half of the contract:
   * the header promises that this file lists what the package's own code needs, and a component
   * reaching for a token nobody defined would fall back to nothing and render invisibly.
   *
   * Empty today, because version 0.1.0 ships no components on purpose. The test is here now rather
   * than later so that the first component to arrive is checked by something that already works.
   */
  const referenced = new Set<string>()
  for (const file of readdirSync(here)) {
    if (file === 'tokens.css') continue
    // COMMENTS ARE STRIPPED FIRST, and leaving them in is not a hypothetical mistake: the first
    // version of this test failed because `style.ts` explains itself by quoting `var(--state-pass)`
    // in prose, and this file quotes `var(--name)` two lines above. Both were reported as tokens
    // the package uses and does not define.
    //
    // The stripping is allowed to be crude, and may take a `//` inside a string literal with it,
    // because the two errors are not equally bad. Over-stripping loses a reference and weakens the
    // check quietly. Under-stripping fails the build every time somebody writes a token name in a
    // sentence, which trains people to delete the test.
    const source = readFileSync(join(here, file), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
    for (const match of source.matchAll(/var\((--[a-z0-9-]+)/g)) {
      referenced.add(match[1] ?? '')
    }
  }

  it('defines every token its own code refers to', () => {
    expect([...referenced].filter((name) => !light.includes(name))).toEqual([])
  })
})
