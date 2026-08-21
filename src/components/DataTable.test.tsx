import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { DataTable, type Column } from './DataTable.js'

type Job = { slug: string; repo: string; minutes: number }

const JOBS: Job[] = [
  { slug: 'rr_17_57', repo: 'owner/thing', minutes: 240 },
  { slug: 'rr_21_193', repo: 'owner/other', minutes: 15 },
]

const COLUMNS: Column<Job>[] = [
  { head: 'repository', cell: (job) => job.repo },
  { head: 'a person would have', align: 'right', cell: (job) => `${job.minutes}m` },
]

/**
 * THE TWO DASHBOARDS FACTORED THEIR INDEX TABLE ON OPPOSITE AXES, one the shell and one the cells,
 * and these are the assertions about the joint between the two halves. Nothing here asserts what a
 * cell says: that is the half that stays in each consumer, because it reaches for a vocabulary
 * neither server has agreed with the other.
 */
group('the shell of a table', () => {
  it('sets a heading and its cells the same way round, so the two cannot drift apart', () => {
    // Two props would eventually produce a right-aligned column under a left-aligned heading, which
    // is worse than either alignment on its own.
    const said = renderToStaticMarkup(
      <DataTable rows={JOBS} columns={COLUMNS} rowKey={(job) => job.slug} />,
    )

    expect(said.match(/text-align:right/g)?.length).toBe(3)
  })

  it('will not let a column’s own style reach the inset every table on the site shares', () => {
    // One consumer has a test that fails the moment two of its tables disagree about the gutter. An
    // override that could reach the padding is how that test starts failing for a reason nobody can
    // find, so the shared cell is spread over the column's style rather than under it.
    const said = renderToStaticMarkup(
      <DataTable
        rows={JOBS}
        columns={[
          {
            head: 'repository',
            cellStyle: { padding: '0', color: 'var(--text-tertiary)' },
            cell: (job) => job.repo,
          },
        ]}
        rowKey={(job) => job.slug}
      />,
    )

    expect(said).toContain('padding:9px 24px')
    expect(said).not.toContain('padding:0')
    // What a column IS allowed to say still gets through.
    expect(said).toContain('color:var(--text-tertiary)')
  })

  it('asks the caller what identifies a row rather than using where the row sits', () => {
    // A cell in either table holds open state that rides on the key, so a row keyed by position
    // hands its open fold to a different row the moment the rows are re-ordered.
    const asked: Job[] = []
    renderToStaticMarkup(
      <DataTable
        rows={JOBS}
        columns={COLUMNS}
        rowKey={(job) => {
          asked.push(job)
          return job.slug
        }}
      />,
    )

    expect(asked.map((job) => job.slug)).toEqual(['rr_17_57', 'rr_21_193'])
  })

  it('renders the rows in the order it was handed them, because one consumer’s order is its plan', () => {
    // There is no `sort` prop and that is deliberate: one of the two sorts before rendering and the
    // other has a written decision not to, because its table's order is the run's plan.
    const said = renderToStaticMarkup(
      <DataTable rows={JOBS} columns={COLUMNS} rowKey={(job) => job.slug} />,
    )

    expect(said.indexOf('owner/thing')).toBeLessThan(said.indexOf('owner/other'))
  })

  it('says something rather than showing headings over nothing when there are no rows', () => {
    const said = renderToStaticMarkup(
      <DataTable
        rows={[]}
        columns={COLUMNS}
        rowKey={(job: Job) => job.slug}
        empty={<p>No bumps yet.</p>}
      />,
    )

    expect(said).toBe('<p>No bumps yet.</p>')
  })

  it('shows the headings alone when the caller has not said what empty means', () => {
    // A caller that has already said something above the table should not be made to say it twice.
    const said = renderToStaticMarkup(
      <DataTable rows={[]} columns={COLUMNS} rowKey={(job: Job) => job.slug} />,
    )

    expect(said).toContain('repository')
    expect(said).toContain('<tbody></tbody>')
  })

  it('explains a column’s notation on the heading rather than on every row beneath it', () => {
    // A title repeated per row is the same sentence rendered fifty times into a document a reader
    // may be searching.
    const said = renderToStaticMarkup(
      <DataTable
        rows={JOBS}
        columns={[{ head: 'pipeline', headTitle: 'which pipeline produced the row', cell: () => 'a1b2' }]}
        rowKey={(job) => job.slug}
      />,
    )

    expect(said.match(/which pipeline produced the row/g)?.length).toBe(1)
  })

  it('names what each heading heads, which only one of the two originals did', () => {
    // Correct table markup rather than behaviour, so it travels: a heading that does not say what it
    // heads is one a screen reader has to guess at.
    const said = renderToStaticMarkup(
      <DataTable rows={JOBS} columns={COLUMNS} rowKey={(job) => job.slug} />,
    )

    expect(said.match(/scope="col"/g)?.length).toBe(2)
  })

  it('takes a row class from the consumer instead of shipping one, because a utility class that is not scanned goes quiet', () => {
    // The class only exists if the consumer's own stylesheet generator saw the literal string. A
    // hover band written in this package and installed into node_modules is a rule that may simply
    // never be emitted, with no error and no failing test.
    const said = renderToStaticMarkup(
      <DataTable
        rows={JOBS}
        columns={COLUMNS}
        rowKey={(job) => job.slug}
        rowClassName="hover:bg-[var(--state-hover-bg)]"
      />,
    )

    expect(said.match(/class="hover:bg-\[var\(--state-hover-bg\)\]"/g)?.length).toBe(2)
  })
})
