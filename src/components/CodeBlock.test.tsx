import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { CodeBlock } from './CodeBlock.js'

/**
 * WHAT THESE TESTS ARE ACTUALLY GUARDING, WHICH IS NOT "THE COLOURS ARE RIGHT".
 *
 * Three of the four say the same thing from different sides: a token's insides belong to that token
 * and to nothing else. A keyword inside a string is not a keyword, a quote inside a comment does not
 * open a string, and a second block on the same page is not affected by the first. All three fail
 * together the moment somebody colours by running four replacements over the same text, or hands
 * this module's pattern to `exec`.
 *
 * WHAT NO TEST HERE CAN SEE. The `exec` hazard is a fact about a shared `lastIndex` and an early
 * exit, and an early exit is by definition the path that does not happen in a passing render. What
 * is observable is the half below: two blocks in one tree come out identical. The rule that closes
 * the other half is written in the component and cannot be automated: this pattern is only ever
 * handed to `matchAll`.
 */

/** A comment, a string, a keyword and a number, so one render exercises all four branches. */
const ALL_FOUR = '/* what this is */ int x = "s" + 42;'

/**
 * The text of each coloured span, with React's escaping undone.
 *
 * THE ESCAPING IS THE POINT OF UNDOING IT HERE. Every quote in the markup arrives as `&quot;`
 * because React escaped it, which is exactly the guarantee the component's header claims, so these
 * tests read the source back rather than asserting against the entities and quietly passing the day
 * somebody swaps in `dangerouslySetInnerHTML` and the escaping stops happening.
 */
const spansIn = (markup: string): string[] =>
  [...markup.matchAll(/<span[^>]*>([^<]*)<\/span>/g)].map((m) =>
    (m[1] ?? '')
      .replaceAll('&quot;', '"')
      .replaceAll('&#x27;', "'")
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&amp;', '&'),
  )

group('a block of source', () => {
  it('keeps a keyword that is inside a string inside the string, because one alternation consumes the whole literal before the word branch is offered its first character', () => {
    const markup = renderToStaticMarkup(
      <CodeBlock code={'String s = "public class int 42"; int n = 7;'} language="java" />,
    )
    const spans = spansIn(markup)
    // The literal comes back whole and coloured as a string, and none of the three keywords or the
    // number inside it was ever a token.
    expect(spans).toContain('"public class int 42"')
    expect(spans).not.toContain('public')
    expect(spans).not.toContain('class')
    expect(markup).toContain('color:var(--code-string)')
    // The `int` OUTSIDE the literal is still a keyword, which is what says the branch works and the
    // string simply got there first.
    expect(spans).toContain('int')
  })

  it('keeps a quote that is inside a comment inside the comment, so a comment cannot open a string that swallows everything after it', () => {
    const markup = renderToStaticMarkup(
      <CodeBlock code={'// the "public" API\nint x = 1;'} language="java" />,
    )
    const spans = spansIn(markup)
    expect(spans[0]).toBe('// the "public" API')
    expect(markup).toContain('color:var(--code-comment);font-style:italic')
    // Had the quote opened a string, everything to the next quote would have been one token and
    // `int` on the following line would not be a keyword.
    expect(spans).toContain('int')
    expect(markup).toContain('color:var(--code-keyword)')
  })

  it('colours two blocks on one page identically, because matchAll never writes the shared cursor and nothing here ever hands the pattern to exec', () => {
    const once = renderToStaticMarkup(<CodeBlock code={ALL_FOUR} language="java" />)
    const twice = renderToStaticMarkup(
      <>
        <CodeBlock code={ALL_FOUR} language="java" />
        <CodeBlock code={ALL_FOUR} language="java" />
      </>,
    )
    // Not merely "the second one has some colour": byte for byte the same block twice, which is the
    // only shape in which a cursor left behind by the first would be visible.
    expect(twice).toBe(once + once)
    expect(spansIn(once).length).toBeGreaterThan(0)
  })

  it('renders nothing at all for source that is blank, because an empty bordered box claims there is source and that it is empty', () => {
    expect(renderToStaticMarkup(<CodeBlock code={'   \n\t  '} language="java" />)).toBe('')
    expect(renderToStaticMarkup(<CodeBlock code={''} />)).toBe('')
  })

  it('renders source in no language as plain text with no spans, because colouring something this lexer cannot read is a confident wrong answer', () => {
    const markup = renderToStaticMarkup(<CodeBlock code={ALL_FOUR} />)
    expect(markup).not.toContain('<span')
    expect(markup).toContain('int x =')
  })

  it('resolves every token through a contract name, so that no colour enters this package', () => {
    const markup = renderToStaticMarkup(<CodeBlock code={ALL_FOUR} language="java" />)
    for (const name of ['--code-comment', '--code-string', '--code-keyword', '--code-number']) {
      expect(markup).toContain(`color:var(${name})`)
    }
    expect(markup).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it('escapes the source it is handed rather than trusting the caller, because one caller will hand it a diff with a tag in it', () => {
    const markup = renderToStaticMarkup(
      <CodeBlock code={'List<String> xs = null; // <script>alert(1)</script>'} language="java" />,
    )
    expect(markup).not.toContain('<script')
    expect(markup).toContain('&lt;script')
    // And the escaping survives colouring: the comment branch took that whole tail as one token.
    expect(spansIn(markup)).toContain('// <script>alert(1)</script>')
  })

  it('names the monospace stack rather than leaving the face to the browser, because the copy that dropped it is the drift that decided this case', () => {
    const markup = renderToStaticMarkup(<CodeBlock code={'x'} />)
    expect(markup).toContain('font-family:ui-monospace, SFMono-Regular, Menlo, monospace')
    // The margin is the one declaration that disagreed three ways across the two repositories, so
    // it belongs to the call site and this shell sets none.
    expect(markup).toContain('margin:0')
  })
})
