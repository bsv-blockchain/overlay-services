import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  // 1. Add score column to outputs table for pagination/sorting
  const hasScoreColumn = await knex.schema.hasColumn('outputs', 'score')
  
  if (!hasScoreColumn) {
    // Add new column for score (can be timestamp or any other sorting factor)
    await knex.schema.table('outputs', table => {
      table.float('score').notNullable().defaultTo(0)
      // Create compound index on topic and score for efficient querying
      table.index(['topic', 'score'])
    })
  }

  // 2. Create host_sync_state table for tracking sync progress per host/topic
  const hostSyncStateExists = await knex.schema.hasTable('host_sync_state')
  
  if (!hostSyncStateExists) {
    await knex.schema.createTable('host_sync_state', table => {
      table.string('host').notNullable()
      table.string('topic').notNullable()
      table.bigInteger('since').unsigned().notNullable()
      table.primary(['host', 'topic'])
      table.index('host')
      table.index('topic')
    })
  }
}

export async function down (knex: Knex): Promise<void> {
  // Rollback in reverse order
  
  // 1. Drop host_sync_state table
  await knex.schema.dropTableIfExists('host_sync_state')
  
  // 2. Remove score column from outputs table
  const hasScoreColumn = await knex.schema.hasColumn('outputs', 'score')
  if (hasScoreColumn) {
    await knex.schema.table('outputs', table => {
      // Drop the compound index on topic and score
      table.dropIndex(['topic', 'score'])
      table.dropColumn('score')
    })
  }
}