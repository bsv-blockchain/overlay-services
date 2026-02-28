import { Storage } from '../Storage.js'
import { Knex } from 'knex'
import type { Output } from '../../Output.js'

const OUTPUT_SELECT_FIELDS = [
  'outputs.txid',
  'outputs.outputIndex',
  'outputs.outputScript',
  'outputs.topic',
  'outputs.satoshis',
  'outputs.outputsConsumed',
  'outputs.spent',
  'outputs.consumedBy',
  'outputs.score'
] as const

export class KnexStorage implements Storage {
  knex: Knex

  constructor (knex: Knex) {
    this.knex = knex
  }

  private parseOutputRelations(
    value: string | Array<{ txid: string, outputIndex: number }>
  ): Array<{ txid: string, outputIndex: number }> {
    if (Array.isArray(value)) {
      return value
    }
    return JSON.parse(value)
  }

  private parseOutputRecord(
    row: any,
    includeBEEF: boolean,
    beefOverride?: number[]
  ): Output {
    return {
      ...row,
      outputScript: Array.from(row.outputScript),
      beef: includeBEEF ? (beefOverride ?? (row.beef !== undefined ? Array.from(row.beef) : undefined)) : undefined,
      spent: Boolean(row.spent),
      outputsConsumed: this.parseOutputRelations(row.outputsConsumed),
      consumedBy: this.parseOutputRelations(row.consumedBy)
    }
  }

  private async fetchTransactionBeefMap(txids: string[]): Promise<Map<string, number[]>> {
    if (txids.length === 0) {
      return new Map<string, number[]>()
    }

    const rows = await this.knex('transactions')
      .whereIn('txid', txids)
      .select(['txid', 'beef'])

    const beefByTxid = new Map<string, number[]>()
    for (const row of rows) {
      if (row.beef !== undefined) {
        beefByTxid.set(row.txid, Array.from(row.beef))
      }
    }
    return beefByTxid
  }

  async findOutput (txid: string, outputIndex: number, topic?: string, spent?: boolean, includeBEEF: boolean = false): Promise<Output | null> {
    const search: {
      'outputs.txid': string
      'outputs.outputIndex': number
      'outputs.topic'?: string
      'outputs.spent'?: boolean
    } = {
      'outputs.txid': txid,
      'outputs.outputIndex': outputIndex
    }
    if (topic !== undefined) search['outputs.topic'] = topic
    if (spent !== undefined) search['outputs.spent'] = spent

    const query = this.knex('outputs').where(search)
    const selectFields: string[] = [...OUTPUT_SELECT_FIELDS]

    if (includeBEEF) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      query.leftJoin('transactions', 'outputs.txid', 'transactions.txid')
      selectFields.push('transactions.beef')
    }

    const output = await query.select(selectFields).first()

    if (output === undefined || output === null) {
      return null
    }

    return this.parseOutputRecord(output, includeBEEF)
  }

  async findOutputsByOutpoints (
    outpoints: Array<{ txid: string, outputIndex: number }>,
    includeBEEF: boolean = false
  ): Promise<Output[]> {
    if (outpoints.length === 0) {
      return []
    }

    const deduped = new Map<string, { txid: string, outputIndex: number }>()
    for (const outpoint of outpoints) {
      deduped.set(`${outpoint.txid}:${outpoint.outputIndex}`, outpoint)
    }

    const rows = await this.knex('outputs')
      .whereIn(
        ['outputs.txid', 'outputs.outputIndex'],
        Array.from(deduped.values()).map(outpoint => [outpoint.txid, outpoint.outputIndex])
      )
      .select([...OUTPUT_SELECT_FIELDS])

    if (rows === undefined || rows.length === 0) {
      return []
    }

    if (!includeBEEF) {
      return rows.map(row => this.parseOutputRecord(row, false))
    }

    const txids = Array.from(new Set(rows.map(row => row.txid)))
    const beefByTxid = await this.fetchTransactionBeefMap(txids)
    return rows.map(row => this.parseOutputRecord(row, true, beefByTxid.get(row.txid)))
  }

  async findOutputsForTransaction (txid: string, includeBEEF: boolean = false): Promise<Output[]> {
    const outputs = await this.knex('outputs')
      .where({ 'outputs.txid': txid })
      .select([...OUTPUT_SELECT_FIELDS])

    if (outputs === undefined || outputs.length === 0) {
      return []
    }

    if (!includeBEEF) {
      return outputs.map(output => this.parseOutputRecord(output, false))
    }

    const beefByTxid = await this.fetchTransactionBeefMap([txid])
    return outputs.map(output => this.parseOutputRecord(output, true, beefByTxid.get(output.txid)))
  }

  async findUTXOsForTopic (topic: string, since?: number, limit?: number, includeBEEF: boolean = false): Promise<Output[]> {
    // Base query to get outputs
    const query = this.knex('outputs').where({ 'outputs.topic': topic, 'outputs.spent': false })

    // If provided, additionally filters UTXOs by score
    if (since !== undefined && since > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      query.andWhere('outputs.score', '>=', since)
    }

    // Sort by score
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    query.orderBy('outputs.score', 'asc')

    // Apply limit if specified
    if (limit !== undefined && limit > 0) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      query.limit(limit)
    }

    const outputs = await query.select([...OUTPUT_SELECT_FIELDS])

    if (outputs === undefined || outputs.length === 0) {
      return []
    }

    if (!includeBEEF) {
      return outputs.map(output => this.parseOutputRecord(output, false))
    }

    const txids = Array.from(new Set(outputs.map(output => output.txid)))
    const beefByTxid = await this.fetchTransactionBeefMap(txids)
    return outputs.map(output => this.parseOutputRecord(output, true, beefByTxid.get(output.txid)))
  }

  async deleteOutput (txid: string, outputIndex: number, _: string): Promise<void> {
    await this.knex.transaction(async trx => {
      // Delete the specific output
      await trx('outputs').where({ txid, outputIndex }).del()

      // Check how many outputs reference the same transaction
      const remainingOutputs = await trx('outputs').where({ txid }).count('* as count').first()

      if (remainingOutputs !== undefined && Number(remainingOutputs.count) === 0) {
        // If no more outputs reference the transaction, delete the beef
        await trx('transactions').where({ txid }).del()
      }
    })
  }

  async insertOutput (output: Output): Promise<void> {
    await this.knex.transaction(async trx => {
      const existing = await trx('outputs').where({
        txid: output.txid,
        outputIndex: Number(output.outputIndex),
        topic: output.topic
      }).first()

      if (existing === undefined || existing === null) {
        await trx('outputs').insert({
          txid: output.txid,
          outputIndex: Number(output.outputIndex),
          outputScript: Buffer.from(output.outputScript),
          topic: output.topic,
          satoshis: Number(output.satoshis),
          outputsConsumed: JSON.stringify(output.outputsConsumed),
          consumedBy: JSON.stringify(output.consumedBy),
          spent: output.spent,
          score: output.score
        })
      }

      if (output.beef !== undefined) {
        await trx('transactions').insert({
          txid: output.txid,
          beef: Buffer.from(output.beef)
        }).onConflict('txid').ignore()
      }
    })
  }

  async markUTXOAsSpent (txid: string, outputIndex: number, topic?: string): Promise<void> {
    await this.knex('outputs').where({
      txid,
      outputIndex,
      topic
    }).update('spent', true)
  }

  async updateConsumedBy (txid: string, outputIndex: number, topic: string, consumedBy: Array<{ txid: string, outputIndex: number }>): Promise<void> {
    await this.knex('outputs').where({
      txid,
      outputIndex,
      topic
    }).update('consumedBy', JSON.stringify(consumedBy))
  }

  async updateTransactionBEEF (txid: string, beef: number[]): Promise<void> {
    await this.knex('transactions').where({
      txid
    }).update('beef', Buffer.from(beef))
  }

  async updateOutputBlockHeight (txid: string, outputIndex: number, topic: string, blockHeight: number): Promise<void> {
    await this.knex('outputs').where({
      txid,
      outputIndex,
      topic
    }).update('blockHeight', blockHeight)
  }

  async insertAppliedTransaction (tx: { txid: string, topic: string }): Promise<void> {
    await this.knex('applied_transactions').insert({
      txid: tx.txid,
      topic: tx.topic
    })
  }

  async doesAppliedTransactionExist (tx: { txid: string, topic: string }): Promise<boolean> {
    const result = await this.knex('applied_transactions')
      .where({ txid: tx.txid, topic: tx.topic })
      .select(this.knex.raw('1'))
      .first()

    return !!result
  }

  async updateLastInteraction (host: string, topic: string, since: number): Promise<void> {
    await this.knex('host_sync_state')
      .insert({ host, topic, since })
      .onConflict(['host', 'topic'])
      .merge({ since })
  }

  async getLastInteraction (host: string, topic: string): Promise<number> {
    const result = await this.knex('host_sync_state')
      .where({ host, topic })
      .select('since')
      .first()

    return result ? result.since : 0
  }
}
