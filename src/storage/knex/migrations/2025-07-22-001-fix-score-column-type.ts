import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  // Fix score column type from float to bigint to handle large timestamp values
  const hasScoreColumn = await knex.schema.hasColumn('outputs', 'score')
  
  if (hasScoreColumn) {
    // Modify the score column to be bigint instead of float
    await knex.schema.table('outputs', table => {
      table.bigInteger('score').notNullable().defaultTo(0).alter()
    })
  }
}

export async function down (knex: Knex): Promise<void> {
  // Rollback to original float type
  const hasScoreColumn = await knex.schema.hasColumn('outputs', 'score')
  
  if (hasScoreColumn) {
    await knex.schema.table('outputs', table => {
      table.float('score', 8, 2).notNullable().defaultTo(0).alter()
    })
  }
}
