## About

**GASP (Graph Aware Sync Protocol)** is the synchronization protocol overlay nodes use to replicate overlay-relevant transaction data between peers in a way that is **verifiable**, **complete**, and **bandwidth-efficient**. Instead of just sending raw TXIDs or copying a flat UTXO list, GASP reconciles **transaction graphs** by exchanging transactions/outputs with proof material and then **recursively requesting any missing input transactions** needed to validate what was received.

At a high level, GASP is built around:

- **Legitimacy:** Nodes only finalize data they can validate by anchoring it back to the blockchain (e.g., using merkle proofs / SPV-style verification).
- **Completeness:** If a transaction depends on other transactions, the protocol recursively fetches all required inputs so the end result isn’t partial or broken.
- **Efficiency:** Nodes only sync what they don’t have, reducing duplicates and bandwidth.
- **Redundancy / availability:** Multiple nodes can converge on the same overlay view over time, improving uptime and reducing single-host dependency.

## Importance

Overlays are useful because they let you track only the topic you care about. But once an overlay is distributed (multiple nodes serving the same topic), nodes need a path to **catch up** and **stay consistent** over time.

GASP matters because it gives you:

- **Redundancy and uptime:** If one overlay host goes offline, other synced hosts can still serve the same topic, reducing single points of failure.
- **Fast bootstrap:** A fresh node can synchronize overlay state from peers instead of re-ingesting all previous transactions from scratch.
- **Lower-trust sync (for correctness):** Peers exchange transactions with proofs and recursively prove inputs, so received data can be validated instead of trusted blindly. *(This doesn’t replace your auth policy; it reduces trust needed for correctness.)*
- **Scaling the ecosystem:** As more apps and topics exist, GASP enables horizontal growth (more hosts for the same topic) instead of centralizing into one massive indexer.

## How GASP Works

One party initiates sync by summarizing what it currently has, then the peer responds with what’s missing, and both sides iterate until they converge.

A typical flow looks like:

1) **Summarize local state**  
   The initiator summarizes known spendable outpoints (commonly via a Bloom filter over TXID+VOUT).

2) **Responder sends “missing” inventory**  
   The responder identifies items the initiator likely doesn’t have and returns inventory entries containing the output/transaction plus proof material (and optional metadata).

3) **Recursive completion**  
   If the initiator is missing any input transactions required to validate what it received, it requests them. This repeats recursively until the needed graph is complete.

4) **Verification + finalize**  
   Anything that can’t be validated/anchored is ignored rather than partially imported.

## Usage

There are two main ways to activate and run GASP sync:

- **With CARS (cloud / managed):** Use CARS menus to enable sync options and deploy.
- **Without CARS (direct / self-managed):** Run your own Overlay Express server and trigger sync using the admin endpoints.

> **Important:** For GASP sync to work, *both* parties must have GASP enabled and must be configured to sync the same topic(s).

---

### With CARS

> If your project has a package.json script called `cars`, you can use `npm run cars`. Otherwise you typically run `cars` directly.

### Using CARS (high level)

- `npm run cars` *(or `cars`)*
- Manage Projects
- Edit Advanced Engine Config
- Choose correct CARS config
- Toggle `gaspSync`
- Edit `syncConfiguration`
- Add your topic manager name(s) (e.g. `tm_example`)
- Back → Done
- Back to main menu
- Build Artifact → Auto-create new release and upload latest artifact now

### Side notes

- Simply toggling `gaspSync` is not enough if your node is not “interested” in syncing your topic.  
  You must also ensure your topic manager name is included in `syncConfiguration` so the engine knows which topic(s) to sync.

---

### Without CARS

Without CARS, you run your own Overlay Express server and configure the overlay engine so it:
1) **discovers peers / publishes ads** (via an advertiser), and
2) knows **which topic managers to sync** (via `syncConfiguration`), and
3) has **GASP enabled**.

## Minimal engine config you must have

The most important lines are:

```ts
server.configureEngineParams({
  advertiser: wa,
  syncConfiguration: {
    'tm_plite': 'SHIP',
    'tm_blockbeta': 'SHIP',
  },
  logTime: false,
  logPrefix: '[OVERLAY] ',
  throwOnBroadcastFailure: false,
  suppressDefaultSyncAdvertisements: true,
})
// ^ tells the engine which topic(s) you want to sync, and the discovery mechanism to use (e.g. SHIP)

server.configureEnableGASPSync(true)
// ^ enables GASP sync in Overlay Express
```

## **Overlay Express Setup Example**

```
import { WalletAdvertiser } from '@bsv/overlay-discovery-services'
import OverlayExpress from '@bsv/overlay-express'
import { config } from 'dotenv'
import packageJson from '../package.json'
import PollrTopicManager from './services/pollroverlay/PollrTopicManager'
import PollrLookupServiceFactory from './services/pollroverlay/PollrLookupServiceFactory'
import ForumTopicManager from './services/blockitoverlay/ForumTopicManager'
import ForumLookupService from './services/blockitoverlay/ForumLookupServiceFactory'

config()

const main = async () => {
  const server = new OverlayExpress(
    process.env.NODE_NAME!,
    process.env.SERVER_PRIVATE_KEY!,
    process.env.HOSTING_URL!,
    process.env.ADMIN_TOKEN! // your chosen admin token to use the admin API
  )

  const wa = new WalletAdvertiser(
    process.env.NETWORK! as 'main' | 'test',
    process.env.SERVER_PRIVATE_KEY!,
    process.env.WALLET_STORAGE_URL!,
    process.env.HOSTING_URL!
  )

  await wa.init()

  server.configureEngineParams({
    advertiser: wa,
    syncConfiguration: {
      'tm_plite': 'SHIP',
      'tm_blockbeta': 'SHIP',
    },
    logTime: false,
    logPrefix: '[OVERLAY] ',
    throwOnBroadcastFailure: false,
    suppressDefaultSyncAdvertisements: true,
  })

  server.configureArcApiKey(process.env.ARC_API_KEY!)
  server.configurePort(8080)

  await server.configureKnex(process.env.KNEX_URL!)
  await server.configureMongo(process.env.MONGO_URL!)

  server.configureTopicManager('tm_plite', new PollrTopicManager())
  server.configureLookupServiceWithMongo('ls_plite', PollrLookupServiceFactory)

  server.configureTopicManager('tm_blockbeta', new ForumTopicManager())
  server.configureLookupServiceWithMongo('ls_blockbeta', ForumLookupService)

  server.configureEnableGASPSync(true)

  await server.configureEngine()

  server.app.get('/version', (req, res) => res.json(packageJson))

  await server.start()
}

main()
```

# **Validation**

A practical way to validate sync is to compare per-topic records in your SQL database before and after sync.

Example (adapt the table/query to your schema):
### **Before sync**

```
+-------------+----+
| topic       | n  |
+-------------+----+
| tm_plite    |  2 |
| tm_blockbeta|  1 |
| tm_ship     |  2 |
| tm_slap     |  2 |
+-------------+----+
```

### **After sync**

```
+-------------+------+
| topic       | n    |
+-------------+------+
| tm_plite    |   10 |
| tm_blockbeta|   17 |
| tm_ship     | 2177 |
| tm_slap     |    2 |
+-------------+------+
```

**What you’re looking for:** the topic(s) you care about (e.g. tm_plite, tm_blockbeta) should move toward the same counts/data across nodes after sync, and your lookup results for identical queries should converge as well.