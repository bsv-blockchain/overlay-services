# Getting Started with BSV Overlay Services Engine

[🏠 Home](../README.md) | [📚 API](../API.md) | [💡 Concepts](../concepts/README.md) | [📖 Examples](./README.md) | [⚙️ Internal](../internal/README.md)

---

## Introduction to BSV Overlay Services Engine

The BSV Overlay Services Engine is the low-level runtime for topic managers and lookup services. It validates candidate outputs, stores admitted UTXOs, tracks spends, answers lookup questions, and coordinates synchronization between overlay nodes.

If you want to run an HTTP overlay node, start with [`@bsv/overlay-express`](https://github.com/bsv-blockchain/overlay-express). If you want a local or cloud application runtime, use LARS or CARS with the BRC-102 `deployment-info.json` structure. Use `@bsv/overlay` directly when you are building custom infrastructure around the engine.

### Components of the System

1. **Topic Managers** decide which transaction outputs are admitted for a topic.
2. **Lookup Services** index admitted and spent outputs and answer domain-specific lookup questions.
3. **Storage** persists admitted outputs, spend state, history, sync state, and interaction timestamps.
4. **Chain Tracker** verifies SPV data for transactions unless the engine is configured for script-only validation.
5. **Broadcaster** submits accepted transactions to the network.
6. **Advertiser** publishes SHIP and SLAP availability records when peer discovery is enabled.

### Setting Up the Engine

Install the current packages:

```bash
npm i @bsv/overlay @bsv/sdk knex
```

Create the engine with your concrete implementations:

```ts
import { Engine, KnexStorage } from '@bsv/overlay'
import { WhatsOnChain, NodejsHttpClient, ARC } from '@bsv/sdk'
import knexFactory from 'knex'

import { ExampleLookupService } from './services/ExampleLookupService.js'
import { ExampleTopicManager } from './services/ExampleTopicManager.js'

const knex = knexFactory({
  client: 'mysql2',
  connection: process.env.KNEX_URL
})

const engine = new Engine(
  {
    tm_example: new ExampleTopicManager()
  },
  {
    ls_example: new ExampleLookupService()
  },
  new KnexStorage(knex),
  new WhatsOnChain('test', { httpClient: new NodejsHttpClient() }),
  process.env.HOSTING_URL,
  process.env.SHIP_TRACKERS?.split(',') ?? [],
  process.env.SLAP_TRACKERS?.split(',') ?? [],
  new ARC(process.env.ARC_URL ?? 'https://arc.taal.com', {
    apiKey: process.env.ARC_API_KEY
  }),
  undefined,
  {
    tm_example: 'SHIP'
  }
)
```

Use the string `'scripts only'` for the chain tracker only when the service intentionally skips SPV validation and relies only on script-level checks.

### Submitting a Transaction

Submit tagged BEEF bytes with the topics that should evaluate the transaction:

```ts
import { Transaction } from '@bsv/sdk'

const tx = new Transaction(/* ... */)

const steak = await engine.submit({
  beef: tx.toBEEF(),
  topics: ['tm_example']
})

console.log('Transaction processed:', steak)
```

### Lookup Queries

Ask a lookup service a domain-specific question:

```ts
const answer = await engine.lookup({
  service: 'ls_example',
  query: {
    identityKey: '03...'
  }
})

console.log('Lookup result:', answer)
```

### Service Documentation

Overlay clients and dashboards can retrieve service documentation and metadata directly from the engine:

```ts
const topicDocs = await engine.getDocumentationForTopicManger('tm_example')
const lookupDocs = await engine.getDocumentationForLookupServiceProvider('ls_example')

const topics = await engine.listTopicManagers()
const lookupServices = await engine.listLookupServiceProviders()
```

### Deployment Path

For a public overlay node, wire the engine into HTTP routes using `@bsv/overlay-express` instead of hand-rolling routes. Overlay Express already exposes the standard submit, lookup, sync, health, documentation, and admin surfaces expected by the rest of the BSV overlay ecosystem.

### Conclusion

The BSV Overlay Services Engine is the shared core for overlay validation, indexing, lookup, and synchronization. Keep direct engine usage focused on infrastructure-level integrations, and use Overlay Express, LARS, and CARS for the standard application path.
