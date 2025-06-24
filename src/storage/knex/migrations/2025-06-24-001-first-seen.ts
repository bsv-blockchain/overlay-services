import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  // Check if the column already exists
  const hasColumn = await knex.schema.hasColumn('outputs', 'firstSeen')
  
  if (!hasColumn) {
    // Add new column for firstSeen timestamp (Unix milliseconds)
    await knex.schema.table('outputs', table => {
      table.bigInteger('firstSeen').unsigned().nullable()
      table.index('firstSeen')
    })
    
    // Set existing records to current timestamp
    await knex('outputs').update({
      firstSeen: Date.now()
    })
  }
}

export async function down (knex: Knex): Promise<void> {
  // Remove the firstSeen column and its index (rollback operation)
  await knex.schema.table('outputs', table => {
    table.dropIndex('firstSeen')
    table.dropColumn('firstSeen')
  })
}