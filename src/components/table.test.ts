import { describe as group, expect, it } from 'vitest'

import { CELL, HEAD, ROW, TABLE } from './table.js'

/**
 * THE COLUMN HEADING ARRIVED HERE BYTE-IDENTICAL FROM TWO REPOSITORIES THAT NEVER COMPARED NOTES,
 * so there is nothing to assert about it that either side would fail. What is worth asserting is
 * the one declaration they disagreed about, the two that only one of them had, and the two that
 * hold every table on both sites at the same measure.
 */
group('the four declarations a table is made of', () => {
  it('carries the hairline on the row rather than on the cell, so it spans the whole width', () => {
    // The other version folded a bottom border into every cell. That is a row of separate segments
    // which only look continuous while every cell in the row is the same height, and these tables
    // have cells with two lines in them beside cells with one.
    expect(ROW.borderTop).toBe('1px solid var(--border-soft)')
    expect(CELL.borderBottom).toBeUndefined()
    expect(CELL.borderTop).toBeUndefined()
  })

  it('ends the table where its content ends rather than ruling a line under the last row', () => {
    // The consequence of the line above, and the one visible difference it makes: a rule between
    // rows draws nothing below the final one. A table that wants closing against what follows says
    // so on its own tbody, in its own repository.
    expect(ROW.borderBottom).toBeUndefined()
  })

  it('sets a heading and the body under it at the same inset', () => {
    // A header row set tighter than the rows it heads is a rule about nothing: the first row of a
    // table is not more cramped than the rest of it. It was, in two of one consumer's three tables.
    expect(HEAD.padding).toBe(CELL.padding)
  })

  it('holds every cell at the page gutter, which is not a choice this file gets to make', () => {
    // 24px, the same inset the page header, the tally strip and every section heading use. A cell
    // that inset its content differently would make its column look like it belonged to a different
    // page from the heading above it.
    expect(String(HEAD.padding).endsWith(' 24px')).toBe(true)
    expect(String(CELL.padding).endsWith(' 24px')).toBe(true)
  })

  it('sets the body at the table’s own size, which the other copy left to the page', () => {
    // The second disagreement, and the smaller one: one of the two carried a size here and the other
    // inherited the document's. Naming it is what keeps two tables a click apart reading as one site.
    expect(TABLE.fontSize).toBe('12.5px')
    expect(TABLE.borderCollapse).toBe('collapse')
  })

  it('tops the cell rather than centring it, because several columns carry two lines', () => {
    // A duration over an event count, an estimate beside it. A row whose cells centre themselves
    // independently has no baseline at all.
    expect(CELL.verticalAlign).toBe('top')
  })
})
