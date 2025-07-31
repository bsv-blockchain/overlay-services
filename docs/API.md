# API

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

## Interfaces

| |
| --- |
| [Advertisement](#interface-advertisement) |
| [AdvertisementData](#interface-advertisementdata) |
| [Advertiser](#interface-advertiser) |
| [AppliedTransaction](#interface-appliedtransaction) |
| [GraphNode](#interface-graphnode) |
| [LookupService](#interface-lookupservice) |
| [LookupServiceMetaData](#interface-lookupservicemetadata) |
| [Output](#interface-output) |
| [Storage](#interface-storage) |
| [TopicManager](#interface-topicmanager) |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

### Interface: Advertisement

```ts
export interface Advertisement {
    protocol: "SHIP" | "SLAP";
    identityKey: string;
    domain: string;
    topicOrService: string;
    beef?: number[];
    outputIndex?: number;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Interface: AdvertisementData

```ts
export interface AdvertisementData {
    protocol: "SHIP" | "SLAP";
    topicOrServiceName: string;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Interface: Advertiser

Interface for managing SHIP and SLAP advertisements.
Provides methods for creating, finding, and revoking advertisements.

```ts
export interface Advertiser {
    createAdvertisements: (adsData: AdvertisementData[]) => Promise<TaggedBEEF>;
    findAllAdvertisements: (protocol: "SHIP" | "SLAP") => Promise<Advertisement[]>;
    revokeAdvertisements: (advertisements: Advertisement[]) => Promise<TaggedBEEF>;
    parseAdvertisement: (outputScript: Script) => Advertisement;
}
```

See also: [Advertisement](#interface-advertisement), [AdvertisementData](#interface-advertisementdata)

<details>

<summary>Interface Advertiser Details</summary>

#### Property createAdvertisements

Creates a new SHIP/SLAP advertisement for a given topic.

```ts
createAdvertisements: (adsData: AdvertisementData[]) => Promise<TaggedBEEF>
```
See also: [AdvertisementData](#interface-advertisementdata)

#### Property findAllAdvertisements

Finds all SHIP/SLAP advertisements.

```ts
findAllAdvertisements: (protocol: "SHIP" | "SLAP") => Promise<Advertisement[]>
```
See also: [Advertisement](#interface-advertisement)

#### Property parseAdvertisement

Parses an output script to extract an advertisement.

```ts
parseAdvertisement: (outputScript: Script) => Advertisement
```
See also: [Advertisement](#interface-advertisement)

#### Property revokeAdvertisements

Revokes an existing advertisement, either SHIP or SLAP.

```ts
revokeAdvertisements: (advertisements: Advertisement[]) => Promise<TaggedBEEF>
```
See also: [Advertisement](#interface-advertisement)

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Interface: AppliedTransaction

Represents a transaction that has been applied to a topic.

```ts
export interface AppliedTransaction {
    txid: string;
    topic: string;
}
```

<details>

<summary>Interface AppliedTransaction Details</summary>

#### Property topic

Output index of the applied transaction

```ts
topic: string
```

#### Property txid

TXID of the applied transaction

```ts
txid: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Interface: GraphNode

Represents a node in the temporary graph.

```ts
export interface GraphNode {
    txid: string;
    graphID: string;
    rawTx: string;
    outputIndex: number;
    spentBy?: string;
    proof?: string;
    txMetadata?: string;
    outputMetadata?: string;
    inputs?: Record<string, {
        hash: string;
    }> | undefined;
    children: GraphNode[];
    parent?: GraphNode;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Interface: LookupService

```ts
export interface LookupService {
    readonly admissionMode: AdmissionMode;
    readonly spendNotificationMode: SpendNotificationMode;
    outputAdmittedByTopic: (payload: OutputAdmittedByTopic) => Promise<void> | void;
    outputSpent?: (payload: OutputSpent) => Promise<void> | void;
    outputNoLongerRetainedInHistory?: (txid: string, outputIndex: number, topic: string) => Promise<void> | void;
    outputEvicted: (txid: string, outputIndex: number) => Promise<void> | void;
    lookup: (question: LookupQuestion) => Promise<LookupFormula>;
    getDocumentation: () => Promise<string>;
    getMetaData: () => Promise<LookupServiceMetaData>;
}
```

See also: [AdmissionMode](#type-admissionmode), [LookupFormula](#type-lookupformula), [LookupServiceMetaData](#interface-lookupservicemetadata), [OutputAdmittedByTopic](#type-outputadmittedbytopic), [OutputSpent](#type-outputspent), [SpendNotificationMode](#type-spendnotificationmode)

<details>

<summary>Interface LookupService Details</summary>

#### Property outputAdmittedByTopic

Invoked when a Topic Manager admits a new UTXO.
The payload shape depends on this.admissionMode.

```ts
outputAdmittedByTopic: (payload: OutputAdmittedByTopic) => Promise<void> | void
```
See also: [OutputAdmittedByTopic](#type-outputadmittedbytopic)

#### Property outputEvicted

LEGAL EVICTION:
Permanently remove the referenced UTXO from all indices maintained by the
Lookup Service.  After eviction the service MUST NOT reference the output
in any future lookup answer.

```ts
outputEvicted: (txid: string, outputIndex: number) => Promise<void> | void
```

#### Property outputNoLongerRetainedInHistory

Called when a Topic Manager decides that **historical retention** of the
specified UTXO is no longer required.

```ts
outputNoLongerRetainedInHistory?: (txid: string, outputIndex: number, topic: string) => Promise<void> | void
```

#### Property outputSpent

Invoked when a previously-admitted UTXO is spent.
The payload shape depends on this.spendNotificationMode.

```ts
outputSpent?: (payload: OutputSpent) => Promise<void> | void
```
See also: [OutputSpent](#type-outputspent)

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Interface: LookupServiceMetaData

```ts
export interface LookupServiceMetaData {
    name: string;
    shortDescription: string;
    iconURL?: string;
    version?: string;
    informationURL?: string;
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Interface: Output

Represents an output to be tracked by the Overlay Services Engine

```ts
export interface Output {
    txid: string;
    outputIndex: number;
    outputScript: number[];
    satoshis: number;
    topic: string;
    spent: boolean;
    outputsConsumed: Array<{
        txid: string;
        outputIndex: number;
    }>;
    consumedBy: Array<{
        txid: string;
        outputIndex: number;
    }>;
    beef?: number[];
    blockHeight?: number;
    score?: number;
}
```

<details>

<summary>Interface Output Details</summary>

#### Property beef

The transaction data for the output

```ts
beef?: number[]
```

#### Property consumedBy

Outputs consuming this output

```ts
consumedBy: Array<{
    txid: string;
    outputIndex: number;
}>
```

#### Property outputIndex

index of the output

```ts
outputIndex: number
```

#### Property outputScript

script of the output

```ts
outputScript: number[]
```

#### Property outputsConsumed

Outputs consumed by the transaction associated with the output

```ts
outputsConsumed: Array<{
    txid: string;
    outputIndex: number;
}>
```

#### Property satoshis

number of satoshis in the output

```ts
satoshis: number
```

#### Property spent

Whether the output is spent

```ts
spent: boolean
```

#### Property topic

topic to which the output belongs

```ts
topic: string
```

#### Property txid

TXID of the output

```ts
txid: string
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Interface: Storage

Defines the Storage Engine interface used internally by the Overlay Services Engine.

```ts
export interface Storage {
    insertOutput: (utxo: Output) => Promise<void>;
    findOutput: (txid: string, outputIndex: number, topic?: string, spent?: boolean, includeBEEF?: boolean) => Promise<Output | null>;
    findOutputsForTransaction: (txid: string, includeBEEF?: boolean) => Promise<Output[]>;
    findUTXOsForTopic: (topic: string, since?: number, limit?: number, includeBEEF?: boolean) => Promise<Output[]>;
    deleteOutput: (txid: string, outputIndex: number, topic: string) => Promise<void>;
    markUTXOAsSpent: (txid: string, outputIndex: number, topic: string) => Promise<void>;
    updateConsumedBy: (txid: string, outputIndex: number, topic: string, consumedBy: Array<{
        txid: string;
        outputIndex: number;
    }>) => Promise<void>;
    updateTransactionBEEF: (txid: string, beef: number[]) => Promise<void>;
    updateOutputBlockHeight?: (txid: string, outputIndex: number, topic: string, blockHeight: number) => Promise<void>;
    insertAppliedTransaction: (tx: AppliedTransaction) => Promise<void>;
    doesAppliedTransactionExist: (tx: AppliedTransaction) => Promise<boolean>;
    updateLastInteraction: (host: string, topic: string, since: number) => Promise<void>;
    getLastInteraction: (host: string, topic: string) => Promise<number>;
}
```

See also: [AppliedTransaction](#interface-appliedtransaction), [Output](#interface-output)

<details>

<summary>Interface Storage Details</summary>

#### Property deleteOutput

Deletes an output from storage

```ts
deleteOutput: (txid: string, outputIndex: number, topic: string) => Promise<void>
```

#### Property doesAppliedTransactionExist

Checks if a duplicate transaction exists

```ts
doesAppliedTransactionExist: (tx: AppliedTransaction) => Promise<boolean>
```
See also: [AppliedTransaction](#interface-appliedtransaction)

#### Property findOutput

Finds an output from storage

```ts
findOutput: (txid: string, outputIndex: number, topic?: string, spent?: boolean, includeBEEF?: boolean) => Promise<Output | null>
```
See also: [Output](#interface-output)

#### Property findOutputsForTransaction

Finds outputs with a matching transaction ID from storage

```ts
findOutputsForTransaction: (txid: string, includeBEEF?: boolean) => Promise<Output[]>
```
See also: [Output](#interface-output)

#### Property findUTXOsForTopic

Finds current UTXOs that have been admitted into a given topic

```ts
findUTXOsForTopic: (topic: string, since?: number, limit?: number, includeBEEF?: boolean) => Promise<Output[]>
```
See also: [Output](#interface-output)

#### Property getLastInteraction

Retrieves the last interaction score for a given host and topic

```ts
getLastInteraction: (host: string, topic: string) => Promise<number>
```

#### Property insertAppliedTransaction

Inserts record of the applied transaction

```ts
insertAppliedTransaction: (tx: AppliedTransaction) => Promise<void>
```
See also: [AppliedTransaction](#interface-appliedtransaction)

#### Property insertOutput

Adds a new output to storage

```ts
insertOutput: (utxo: Output) => Promise<void>
```
See also: [Output](#interface-output)

#### Property markUTXOAsSpent

Updates a UTXO as spent

```ts
markUTXOAsSpent: (txid: string, outputIndex: number, topic: string) => Promise<void>
```

#### Property updateConsumedBy

Updates which outputs are consumed by this output

```ts
updateConsumedBy: (txid: string, outputIndex: number, topic: string, consumedBy: Array<{
    txid: string;
    outputIndex: number;
}>) => Promise<void>
```

#### Property updateLastInteraction

Updates the last interaction score for a given host and topic

```ts
updateLastInteraction: (host: string, topic: string, since: number) => Promise<void>
```

#### Property updateOutputBlockHeight

Updates the block height on an output

```ts
updateOutputBlockHeight?: (txid: string, outputIndex: number, topic: string, blockHeight: number) => Promise<void>
```

#### Property updateTransactionBEEF

Updates the beef data for a transaction

```ts
updateTransactionBEEF: (txid: string, beef: number[]) => Promise<void>
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Interface: TopicManager

Defines a Topic Manager interface that can be implemented for specific use-cases

```ts
export interface TopicManager {
    identifyAdmissibleOutputs: (beef: number[], previousCoins: number[], offChainValues?: number[]) => Promise<AdmittanceInstructions>;
    identifyNeededInputs?: (beef: number[], offChainValues?: number[]) => Promise<Array<{
        txid: string;
        outputIndex: number;
    }>>;
    getDocumentation: () => Promise<string>;
    getMetaData: () => Promise<{
        name: string;
        shortDescription: string;
        iconURL?: string;
        version?: string;
        informationURL?: string;
    }>;
}
```

<details>

<summary>Interface TopicManager Details</summary>

#### Property getDocumentation

Returns a Markdown-formatted documentation string for the topic manager.

```ts
getDocumentation: () => Promise<string>
```

#### Property getMetaData

Returns a metadata object that can be used to identify the topic manager.

```ts
getMetaData: () => Promise<{
    name: string;
    shortDescription: string;
    iconURL?: string;
    version?: string;
    informationURL?: string;
}>
```

#### Property identifyAdmissibleOutputs

Returns instructions that denote which outputs from the provided transaction to admit into the topic, and which previous coins should be retained.
Accepts the transaction in BEEF format and an array of those input indices which spend previously-admitted outputs from the same topic.
The transaction's BEEF structure will always contain the transactions associated with previous coins for reference (if any), regardless of whether the current transaction was directly proven.

```ts
identifyAdmissibleOutputs: (beef: number[], previousCoins: number[], offChainValues?: number[]) => Promise<AdmittanceInstructions>
```

#### Property identifyNeededInputs

Identifies and returns the inputs needed to anchor any topical outputs from this transaction to their associated previous history.

```ts
identifyNeededInputs?: (beef: number[], offChainValues?: number[]) => Promise<Array<{
    txid: string;
    outputIndex: number;
}>>
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
## Classes

| |
| --- |
| [Engine](#class-engine) |
| [KnexStorage](#class-knexstorage) |
| [OverlayGASPRemote](#class-overlaygaspremote) |
| [OverlayGASPStorage](#class-overlaygaspstorage) |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

### Class: Engine

An engine for running BSV Overlay Services (topic managers and lookup services).

```ts
export class Engine {
    constructor(public managers: {
        [key: string]: TopicManager;
    }, public lookupServices: {
        [key: string]: LookupService;
    }, public storage: Storage, public chainTracker: ChainTracker | "scripts only", public hostingURL?: string, public shipTrackers?: string[], public slapTrackers?: string[], public broadcaster?: Broadcaster, public advertiser?: Advertiser, public syncConfiguration?: SyncConfiguration, public logTime = false, public logPrefix = "[OVERLAY_ENGINE] ", public throwOnBroadcastFailure = false, public overlayBroadcastFacilitator: OverlayBroadcastFacilitator = new HTTPSOverlayBroadcastFacilitator(), public logger: typeof console = console, public suppressDefaultSyncAdvertisements = true) 
    async submit(taggedBEEF: TaggedBEEF, onSteakReady?: (steak: STEAK) => void, mode: "historical-tx" | "current-tx" = "current-tx", offChainValues?: number[]): Promise<STEAK> 
    async lookup(lookupQuestion: LookupQuestion): Promise<LookupAnswer> 
    async syncAdvertisements(): Promise<void> 
    async startGASPSync(): Promise<void> 
    async provideForeignSyncResponse(initialRequest: GASPInitialRequest, topic: string): Promise<GASPInitialResponse> 
    async provideForeignGASPNode(graphID: string, txid: string, outputIndex: number): Promise<GASPNode> 
    async getUTXOHistory(output: Output, historySelector?: ((beef: number[], outputIndex: number, currentDepth: number) => Promise<boolean>) | number, currentDepth = 0): Promise<Output | undefined> 
    async handleNewMerkleProof(txid: string, proof: MerklePath, blockHeight?: number): Promise<void> 
    async listTopicManagers(): Promise<Record<string, {
        name: string;
        shortDescription: string;
        iconURL?: string;
        version?: string;
        informationURL?: string;
    }>> 
    async listLookupServiceProviders(): Promise<Record<string, {
        name: string;
        shortDescription: string;
        iconURL?: string;
        version?: string;
        informationURL?: string;
    }>> 
    async getDocumentationForTopicManager(manager: any): Promise<string> 
    async getDocumentationForLookupServiceProvider(provider: any): Promise<string> 
}
```

See also: [Advertiser](#interface-advertiser), [LookupService](#interface-lookupservice), [Output](#interface-output), [Storage](#interface-storage), [SyncConfiguration](#type-syncconfiguration), [TopicManager](#interface-topicmanager)

<details>

<summary>Class Engine Details</summary>

#### Constructor

Creates a new Overlay Services Engine

```ts
constructor(public managers: {
    [key: string]: TopicManager;
}, public lookupServices: {
    [key: string]: LookupService;
}, public storage: Storage, public chainTracker: ChainTracker | "scripts only", public hostingURL?: string, public shipTrackers?: string[], public slapTrackers?: string[], public broadcaster?: Broadcaster, public advertiser?: Advertiser, public syncConfiguration?: SyncConfiguration, public logTime = false, public logPrefix = "[OVERLAY_ENGINE] ", public throwOnBroadcastFailure = false, public overlayBroadcastFacilitator: OverlayBroadcastFacilitator = new HTTPSOverlayBroadcastFacilitator(), public logger: typeof console = console, public suppressDefaultSyncAdvertisements = true) 
```
See also: [Advertiser](#interface-advertiser), [LookupService](#interface-lookupservice), [Storage](#interface-storage), [SyncConfiguration](#type-syncconfiguration), [TopicManager](#interface-topicmanager)

Argument Details

+ ****
  + : TopicManager} managers - manages topic admittance
+ ****
  + : LookupService} lookupServices - manages UTXO lookups
+ **storage**
  + for interacting with internally-managed persistent data
+ **chainTracker**
  + Verifies SPV data associated with transactions
+ **hostingURL**
  + The URL this engine is hosted at. Required if going to support peer-discovery with an advertiser.
+ **Broadcaster**
  + broadcaster used for broadcasting the incoming transaction
+ **Advertiser**
  + handles SHIP and SLAP advertisements for peer-discovery
+ **shipTrackers**
  + SHIP domains we know to bootstrap the system
+ **slapTrackers**
  + SLAP domains we know to bootstrap the system
+ **syncConfiguration**
  + — Configuration object describing historical synchronization of topics.
+ **logTime**
  + Enables / disables the timing logs for various operations in the Overlay submit route.
+ **logPrefix**
  + Supports overriding the log prefix with a custom string.
+ **throwOnBroadcastFailure**
  + Enables / disables throwing an error when a transaction broadcast failure is detected.
+ **overlayBroadcastFacilitator**
  + Facilitator for propagation to other Overlay Services.
+ **logger**
  + The place where log entries are written.
+ **suppressDefaultSyncAdvertisements**
  + Whether to suppress the default (SHIP/SLAP) sync advertisements.

#### Method getDocumentationForLookupServiceProvider

Run a query to get the documentation for a particular lookup service

```ts
async getDocumentationForLookupServiceProvider(provider: any): Promise<string> 
```

Returns

-  the documentation for the lookup service

#### Method getDocumentationForTopicManager

Run a query to get the documentation for a particular topic manager

```ts
async getDocumentationForTopicManager(manager: any): Promise<string> 
```

Returns

- the documentation for the topic manager

#### Method getUTXOHistory

Traverse and return the history of a UTXO.

This method traverses the history of a given Unspent Transaction Output (UTXO) and returns
its historical data based on the provided history selector and current depth.

```ts
async getUTXOHistory(output: Output, historySelector?: ((beef: number[], outputIndex: number, currentDepth: number) => Promise<boolean>) | number, currentDepth = 0): Promise<Output | undefined> 
```
See also: [Output](#interface-output)

Returns

- A promise that resolves to the output history if found, or undefined if not.

Argument Details

+ **output**
  + The UTXO to traverse the history for.
+ **historySelector**
  + Optionally directs the history traversal:
- If a number, denotes how many previous spends (in terms of chain depth) to include.
- If a function, accepts a BEEF-formatted transaction, an output index, and the current depth as parameters,
returning a promise that resolves to a boolean indicating whether to include the output in the history.
+ **currentDepth**
  + The current depth of the traversal relative to the top-level UTXO.

#### Method handleNewMerkleProof

Recursively prune UTXOs when an incoming Merkle Proof is received.

```ts
async handleNewMerkleProof(txid: string, proof: MerklePath, blockHeight?: number): Promise<void> 
```

Argument Details

+ **txid**
  + Transaction ID of the associated outputs to prune.
+ **proof**
  + Merkle proof containing the Merkle path and other relevant data to verify the transaction.
+ **blockHeight**
  + The block height associated with the incoming merkle proof.

#### Method listLookupServiceProviders

Find a list of supported lookup services

```ts
async listLookupServiceProviders(): Promise<Record<string, {
    name: string;
    shortDescription: string;
    iconURL?: string;
    version?: string;
    informationURL?: string;
}>> 
```

Returns

- Supported lookup services and their metadata

#### Method listTopicManagers

Find a list of supported topic managers

```ts
async listTopicManagers(): Promise<Record<string, {
    name: string;
    shortDescription: string;
    iconURL?: string;
    version?: string;
    informationURL?: string;
}>> 
```

Returns

- Supported topic managers and their metadata

#### Method lookup

Submit a lookup question to the Overlay Services Engine, and receive back a Lookup Answer

```ts
async lookup(lookupQuestion: LookupQuestion): Promise<LookupAnswer> 
```

Returns

The answer to the question

Argument Details

+ **LookupQuestion**
  + — The question to ask the Overlay Services Engine

#### Method provideForeignGASPNode

Provides a GASPNode for the given graphID, transaction ID, and output index.

```ts
async provideForeignGASPNode(graphID: string, txid: string, outputIndex: number): Promise<GASPNode> 
```

Returns

A promise that resolves to a GASPNode containing the raw transaction and other optional data.

Argument Details

+ **graphID**
  + The identifier for the graph to which this node belongs (in the format txid.outputIndex).
+ **txid**
  + The transaction ID for the requested output from somewhere within the graph's history.
+ **outputIndex**
  + The index of the output in the transaction.

Throws

An error if no output is found for the given transaction ID and output index.

#### Method provideForeignSyncResponse

Given a GASP request, create an initial response.

This method processes an initial synchronization request by finding the relevant UTXOs for the given topic
since the provided block height in the request. It constructs a response that includes a list of these UTXOs
and the min block height from the initial request.

```ts
async provideForeignSyncResponse(initialRequest: GASPInitialRequest, topic: string): Promise<GASPInitialResponse> 
```

Returns

A promise that resolves to a GASPInitialResponse containing the list of UTXOs and the provided min block height.

Argument Details

+ **initialRequest**
  + The GASP initial request containing the version and the block height since the last sync.
+ **topic**
  + The topic for which UTXOs are being requested.

#### Method startGASPSync

This method goes through each topic that we support syncing and attempts to sync with each endpoint
associated with that topic. If the sync configuration is 'SHIP', it will sync to all peers that support
the topic.

```ts
async startGASPSync(): Promise<void> 
```

Throws

Error if the overlay service engine is not configured for topical synchronization.

#### Method submit

Submits a transaction for processing by Overlay Services.

```ts
async submit(taggedBEEF: TaggedBEEF, onSteakReady?: (steak: STEAK) => void, mode: "historical-tx" | "current-tx" = "current-tx", offChainValues?: number[]): Promise<STEAK> 
```

Returns

The submitted transaction execution acknowledgement

Argument Details

+ **taggedBEEF**
  + The transaction to process
+ **onSTEAKReady**
  + Optional callback function invoked when the STEAK is ready.
+ **mode**
  + — Indicates the submission behavior, whether historical or current. Historical transactions are not broadcast or propagated.
+ **offChainValues**
  + — Values necessary to evaluate topical admittance that are not stored on-chain.

The optional callback function should be used to get STEAK when ready, and avoid waiting for broadcast and transaction propagation to complete.

#### Method syncAdvertisements

Ensures alignment between the current SHIP/SLAP advertisements and the
configured Topic Managers and Lookup Services in the engine.

This method performs the following actions:
1. Retrieves the current configuration of topics and services.
2. Fetches the existing SHIP advertisements for each configured topic.
3. Fetches the existing SLAP advertisements for each configured service.
4. Compares the current configuration with the fetched advertisements to determine which advertisements
   need to be created or revoked.
5. Creates new SHIP/SLAP advertisements if they do not exist for the configured topics/services.
6. Revokes existing SHIP/SLAP advertisements if they are no longer required based on the current configuration.

The function uses the `Advertiser` methods to create or revoke advertisements and ensures the updates are
submitted to the SHIP/SLAP overlay networks using the engine's `submit()` method.

```ts
async syncAdvertisements(): Promise<void> 
```

Returns

A promise that resolves when the synchronization process is complete.

Throws

Will throw an error if there are issues during the advertisement synchronization process.

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Class: KnexStorage

```ts
export class KnexStorage implements Storage {
    knex: Knex;
    constructor(knex: Knex) 
    async findOutput(txid: string, outputIndex: number, topic?: string, spent?: boolean, includeBEEF: boolean = false): Promise<Output | null> 
    async findOutputsForTransaction(txid: string, includeBEEF: boolean = false): Promise<Output[]> 
    async findUTXOsForTopic(topic: string, since?: number, limit?: number, includeBEEF: boolean = false): Promise<Output[]> 
    async deleteOutput(txid: string, outputIndex: number, _: string): Promise<void> 
    async insertOutput(output: Output): Promise<void> 
    async markUTXOAsSpent(txid: string, outputIndex: number, topic?: string): Promise<void> 
    async updateConsumedBy(txid: string, outputIndex: number, topic: string, consumedBy: Array<{
        txid: string;
        outputIndex: number;
    }>): Promise<void> 
    async updateTransactionBEEF(txid: string, beef: number[]): Promise<void> 
    async updateOutputBlockHeight(txid: string, outputIndex: number, topic: string, blockHeight: number): Promise<void> 
    async insertAppliedTransaction(tx: {
        txid: string;
        topic: string;
    }): Promise<void> 
    async doesAppliedTransactionExist(tx: {
        txid: string;
        topic: string;
    }): Promise<boolean> 
    async updateLastInteraction(host: string, topic: string, since: number): Promise<void> 
    async getLastInteraction(host: string, topic: string): Promise<number> 
}
```

See also: [Output](#interface-output), [Storage](#interface-storage)

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Class: OverlayGASPRemote

```ts
export class OverlayGASPRemote implements GASPRemote {
    constructor(public endpointURL: string, public topic: string) 
    async getInitialResponse(request: GASPInitialRequest): Promise<GASPInitialResponse> 
    async requestNode(graphID: string, txid: string, outputIndex: number, metadata: boolean): Promise<GASPNode> 
    async getInitialReply(response: GASPInitialResponse): Promise<GASPInitialReply> 
    async submitNode(node: GASPNode): Promise<GASPNodeResponse | undefined> 
}
```

<details>

<summary>Class OverlayGASPRemote Details</summary>

#### Method getInitialResponse

Given an outgoing initial request, sends the request to the foreign instance and obtains their initial response.

```ts
async getInitialResponse(request: GASPInitialRequest): Promise<GASPInitialResponse> 
```

#### Method requestNode

Given an outgoing txid, outputIndex and optional metadata, request the associated GASP node from the foreign instance.

```ts
async requestNode(graphID: string, txid: string, outputIndex: number, metadata: boolean): Promise<GASPNode> 
```

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Class: OverlayGASPStorage

```ts
export class OverlayGASPStorage implements GASPStorage {
    readonly temporaryGraphNodeRefs: Record<string, GraphNode> = {};
    constructor(public topic: string, public engine: Engine, public maxNodesInGraph?: number) 
    async findKnownUTXOs(since: number): Promise<GASPOutput[]> 
    async hydrateGASPNode(graphID: string, txid: string, outputIndex: number, metadata: boolean): Promise<GASPNode> 
    async findNeededInputs(tx: GASPNode): Promise<GASPNodeResponse | undefined> 
    async appendToGraph(tx: GASPNode, spentBy?: string | undefined): Promise<void> 
    async validateGraphAnchor(graphID: string): Promise<void> 
    async discardGraph(graphID: string): Promise<void> 
    async finalizeGraph(graphID: string): Promise<void> 
}
```

See also: [Engine](#class-engine), [GraphNode](#interface-graphnode)

<details>

<summary>Class OverlayGASPStorage Details</summary>

#### Method appendToGraph

Appends a new node to a temporary graph.

```ts
async appendToGraph(tx: GASPNode, spentBy?: string | undefined): Promise<void> 
```

Argument Details

+ **tx**
  + The node to append to this graph.
+ **spentBy**
  + Unless this is the same node identified by the graph ID, denotes the TXID and input index for the node which spent this one, in 36-byte format.

Throws

If the node cannot be appended to the graph, either because the graph ID is for a graph the recipient does not want or because the graph has grown to be too large before being finalized.

#### Method discardGraph

Deletes all data associated with a temporary graph that has failed to sync, if the graph exists.

```ts
async discardGraph(graphID: string): Promise<void> 
```

Argument Details

+ **graphID**
  + The TXID and output index (in 36-byte format) for the UTXO at the tip of this graph.

#### Method finalizeGraph

Finalizes a graph, solidifying the new UTXO and its ancestors so that it will appear in the list of known UTXOs.

```ts
async finalizeGraph(graphID: string): Promise<void> 
```

Argument Details

+ **graphID**
  + The TXID and output index (in 36-byte format) for the UTXO at the root of this graph.

#### Method findNeededInputs

For a given node, returns the inputs needed to complete the graph, including whether updated metadata is requested for those inputs.

```ts
async findNeededInputs(tx: GASPNode): Promise<GASPNodeResponse | undefined> 
```

Returns

A promise for a mapping of requested input transactions and whether metadata should be provided for each.

Argument Details

+ **tx**
  + The node for which needed inputs should be found.

#### Method hydrateGASPNode

For a given txid and output index, returns the associated transaction, a merkle proof if the transaction is in a block, and metadata if if requested. If no metadata is requested, metadata hashes on inputs are not returned.

```ts
async hydrateGASPNode(graphID: string, txid: string, outputIndex: number, metadata: boolean): Promise<GASPNode> 
```

#### Method validateGraphAnchor

Checks whether the given graph, in its current state, makes reference only to transactions that are proven in the blockchain, or already known by the recipient to be valid.
Additionally, in a breadth-first manner (ensuring that all inputs for any given node are processed before nodes that spend them), it ensures that the root node remains valid according to the rules of the overlay's topic manager,
while considering any coins which the Manager had previously indicated were either valid or invalid.

```ts
async validateGraphAnchor(graphID: string): Promise<void> 
```

Argument Details

+ **graphID**
  + The TXID and output index (in 36-byte format) for the UTXO at the tip of this graph.

Throws

If the graph is not well-anchored, according to the rules of Bitcoin or the rules of the Overlay Topic Manager.

</details>

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
## Functions

| | |
| --- | --- |
| [down](#function-down) | [up](#function-up) |
| [down](#function-down) | [up](#function-up) |
| [down](#function-down) | [up](#function-up) |
| [down](#function-down) | [up](#function-up) |
| [down](#function-down) | [up](#function-up) |
| [down](#function-down) | [up](#function-up) |
| [down](#function-down) | [up](#function-up) |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

### Function: down

```ts
export async function down(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: down

```ts
export async function down(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: down

```ts
export async function down(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: down

```ts
export async function down(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: down

```ts
export async function down(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: down

```ts
export async function down(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: down

```ts
export async function down(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: up

```ts
export async function up(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: up

```ts
export async function up(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: up

```ts
export async function up(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: up

```ts
export async function up(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: up

```ts
export async function up(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: up

```ts
export async function up(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Function: up

```ts
export async function up(knex: Knex): Promise<void> 
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
## Types

| |
| --- |
| [AdmissionMode](#type-admissionmode) |
| [LookupFormula](#type-lookupformula) |
| [OutputAdmittedByTopic](#type-outputadmittedbytopic) |
| [OutputSpent](#type-outputspent) |
| [SpendNotificationMode](#type-spendnotificationmode) |
| [SyncConfiguration](#type-syncconfiguration) |

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---

### Type: AdmissionMode

```ts
export type AdmissionMode = "locking-script" | "whole-tx"
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Type: LookupFormula

The formula that will be used by the Overlay Services Engine to compute the Lookup Answer. Can be returned by Lookup Services in response to a Lookup Question.

```ts
export type LookupFormula = Array<{
    txid: string;
    outputIndex: number;
    history?: ((beef: number[], outputIndex: number, currentDepth: number) => Promise<boolean>) | number;
    context?: number[];
}>
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Type: OutputAdmittedByTopic

```ts
export type OutputAdmittedByTopic = {
    mode: "locking-script";
    txid: string;
    outputIndex: number;
    topic: string;
    satoshis: number;
    lockingScript: Script;
    offChainValues?: number[];
} | {
    mode: "whole-tx";
    atomicBEEF: number[];
    outputIndex: number;
    topic: string;
    offChainValues?: number[];
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Type: OutputSpent

```ts
export type OutputSpent = {
    mode: "none";
    txid: string;
    outputIndex: number;
    topic: string;
} | {
    mode: "txid";
    txid: string;
    outputIndex: number;
    topic: string;
    spendingTxid: string;
} | {
    mode: "script";
    txid: string;
    outputIndex: number;
    topic: string;
    spendingTxid: string;
    inputIndex: number;
    unlockingScript: Script;
    sequenceNumber: number;
    offChainValues?: number[];
} | {
    mode: "whole-tx";
    txid: string;
    outputIndex: number;
    topic: string;
    spendingAtomicBEEF: number[];
    offChainValues?: number[];
}
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Type: SpendNotificationMode

```ts
export type SpendNotificationMode = "none" | "txid" | "script" | "whole-tx"
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
### Type: SyncConfiguration

Configuration for synchronizing supported topic managers.

This configuration determines which topics should support synchronization and specifies the mode of synchronization.

There are two synchronization modes:
1. Sync to predefined hardcoded peers for the specified topic, including associated hosting URLs.
2. Use SHIP (Service Host Interconnect Protocol) to sync with all known peers that support the specified topic.

Each entry in the configuration object maps a topic to either an array of overlay service peers (hardcoded URLs) or the string 'SHIP' (for dynamic syncing using SHIP).

Example

```ts
// Example usage of SyncConfiguration
const config: SyncConfiguration = {
  "topicManager1": ["http://peer1.com", "http://peer2.com"],
  "topicManager2": "SHIP"
}
```

```ts
export type SyncConfiguration = Record<string, string[] | "SHIP" | false>
```

Links: [API](#api), [Interfaces](#interfaces), [Classes](#classes), [Functions](#functions), [Types](#types)

---
