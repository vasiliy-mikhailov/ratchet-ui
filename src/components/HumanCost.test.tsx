import { renderToStaticMarkup } from 'react-dom/server'
import { describe as group, expect, it } from 'vitest'

import { HumanCost } from './HumanCost.js'

group('what a job would have cost a person', () => {
  it('spells the estimate the way the measurement beside it is spelled', () => {
    expect(renderToStaticMarkup(<HumanCost minutes={240} />)).toContain('4h')
  })

  it('says nothing when nobody has priced it', () => {
    expect(renderToStaticMarkup(<HumanCost minutes={null} />)).toContain('—')
  })

  it('prints a price of nothing, because somebody claimed it', () => {
    // Unlike a missing span, a zero here is an answer: it is what an estimate becomes when the
    // estimator replied in prose and something parsed it. Hiding it hides the parse failure.
    expect(renderToStaticMarkup(<HumanCost minutes={0} />)).toContain('0s')
  })
})
