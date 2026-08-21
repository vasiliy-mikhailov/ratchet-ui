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

  it('groups every name under one of the functional prefixes the file describes, since a name outside all of them is a vocabulary nobody agreed to', () => {
    // `--code-` IS THE SEVENTH AND ARRIVED WITH `CodeBlock`. A syntax token is not a state, not a
    // surface and not an accent, and filing it under `--text-` would claim a keyword is a weight of
    // importance rather than a kind of thing. Growing this list is the deliberate act this test
    // exists to force: a name that fits none of these fails the build until somebody decides which
    // it is.
    const prefixes = [
      '--bg-',
      '--text-',
      '--border-',
      '--state-',
      '--focus-',
      '--accent-',
      '--danger',
      '--code-',
    ]
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
   * This is the check that decides whether a component may live here. It fired on the first one:
   * moving a pill in unchanged left six `var(--state-pass)`-shaped names pointing at a vocabulary
   * that belongs to one consumer, and the build stayed red until they became contract names.
   */
  const referenced = new Set<string>()
  const defined = new Set<string>()

  function readSourcesUnder(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        readSourcesUnder(join(directory, entry.name))
        continue
      }
      if (entry.name === 'tokens.css') continue
      // TESTS ARE NOT THE CONTRACT. A test builds token names out of template literals to check a
      // component against all six tones at once, and `var(--state-${tone})` reads to this regex as
      // a reference to a token called `--state-`, which nothing defines and nothing should. What
      // the header promises is that the package's SHIPPED code asks only for names listed here, and
      // shipped code is what `tsconfig.build.json` emits, which is everything except these files.
      if (entry.name.includes('.test.')) continue
      // COMMENTS ARE STRIPPED FIRST, and leaving them in is not a hypothetical mistake: the first
      // version of this test failed because `style.ts` explains itself by quoting `var(--state-pass)`
      // in prose, and this file quotes `var(--name)` two lines above. Both were reported as tokens
      // the package uses and does not define.
      //
      // The stripping is allowed to be crude, and may take a `//` inside a string literal with it,
      // because the two errors are not equally bad. Over-stripping loses a reference and weakens the
      // check quietly. Under-stripping fails the build every time somebody writes a token name in a
      // sentence, which trains people to delete the test.
      const source = readFileSync(join(directory, entry.name), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
      for (const match of source.matchAll(/var\((--[a-z0-9-]+)/g)) {
        referenced.add(match[1] ?? '')
      }
      // A COMPONENT MAY DEFINE A PROPERTY FOR ITS OWN USE, and that one is not part of the contract.
      // `Pill` sets `--pill-tone` on the element it draws and reads it from three declarations so
      // the text, the wash and the edge cannot drift apart. Listing it in tokens.css would tell a
      // consumer to define something no consumer can usefully define, which is a lie about what the
      // contract is. So the names the source declares for itself are subtracted from what it asks
      // the consumer for.
      for (const match of source.matchAll(/'(--[a-z0-9-]+)':/g)) {
        defined.add(match[1] ?? '')
      }
    }
  }

  readSourcesUnder(here)

  it('defines every token its own code refers to', () => {
    const asked = [...referenced].filter((name) => !defined.has(name))
    expect(asked.filter((name) => !light.includes(name))).toEqual([])
  })

  it('refers to something, so that an empty walk cannot pass this group by finding nothing', () => {
    expect(referenced.size).toBeGreaterThan(0)
  })
})
