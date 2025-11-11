import type { Knex } from 'knex'

/**
 * Adds optimized index for findUTXOsForTopic queries.
 * This query pattern is: WHERE topic = ? AND spent = false ORDER BY score
 * The composite index (topic, spent, score) enables efficient range scans.
 */
export async function up (knex: Knex): Promise<void> {
  await knex.schema.table('outputs', function (table) {
    table.index(['topic', 'spent', 'score'], 'idx_outputs_topic_spent_score')
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.table('outputs', function (table) {
    table.dropIndex(['topic', 'spent', 'score'], 'idx_outputs_topic_spent_score')
  })
}
