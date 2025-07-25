import { Knex } from 'knex'
import { up as initialSchemaUp, down as initialSchemaDown } from './migrations/2024-05-18-001-initial.js'
import { up as addBlockHeightColumnUp, down as addBlockHeightColumnDown } from './migrations/2024-07-10-001-block-height.js'
import { up as addTransactionsTableUp, down as addTransactionsTableDown } from './migrations/2024-07-17-001-transactions.js'
import { up as addedIndexesUp, down as addedIndexesDown } from './migrations/2024-07-18-001-indexes.js'
import { up as enlargeUp, down as enlargeDown } from './migrations/2025-05-28-001-enlarge.js'
import { up as gaspPaginationSupportUp, down as gaspPaginationSupportDown } from './migrations/2025-06-25-001-gasp-pagination-support.js'
import { up as fixScoreColumnTypeUp, down as fixScoreColumnTypeDown } from './migrations/2025-07-22-001-fix-score-column-type.js'



/**
 * An array of all migrations, in order.
 */
interface Migration {
  up: (knex: Knex) => Promise<void>
  down: (knex: Knex) => Promise<void>
}

const allMigrations: Migration[] = [
  { up: initialSchemaUp, down: initialSchemaDown },
  { up: addBlockHeightColumnUp, down: addBlockHeightColumnDown },
  { up: addTransactionsTableUp, down: addTransactionsTableDown },
  { up: addedIndexesUp, down: addedIndexesDown },
  { up: enlargeUp, down: enlargeDown },
  { up: gaspPaginationSupportUp, down: gaspPaginationSupportDown },
  { up: fixScoreColumnTypeUp, down: fixScoreColumnTypeDown }
]

export default allMigrations
