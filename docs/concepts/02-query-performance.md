# Query Performance and Indexing for Overlays

[🏠 Home](../README.md) | [📚 API](../API.md) | [💡 Concepts](./README.md) | [📖 Examples](../examples/README.md) | [⚙️ Internal](../internal/README.md)

**Navigation:** [Overview](./00-overview.md) | [Best Practices](./01-best-practices.md) | [Query Performance](./02-query-performance.md) | [Database Monitoring](./03-database-monitoring.md) | [Pagination Example](./04-pagination-example.md) | [Recommendations Summary](./05-recommendations-summary.md)

---

## Overview

Efficient query design is critical for scalable overlay performance. Lookup Services often serve thousands of queries per day—fetching messages, reactions, and thread activity—so poor indexing or unbounded queries can quickly degrade performance.

This document explains how to design efficient queries for overlay Lookup Services, using real examples from Convo Messenger.

---

## 1. Query Design Guidelines

### 1.1 Use Indexed Fields for All Queries

Indexes are critical for overlay scalability. Without them, MongoDB must perform full collection scans — a major performance bottleneck.

**Always index fields used in query filters**, such as:

* `threadId`
* `sender`
* `recipient`
* `createdAt`

Example:

```js
db.convoMessages.createIndex({ threadId: 1 });
db.convoMessages.createIndex({ parentMessageId: 1 });
db.convoMessages.createIndex({ threadId: 1, createdAt: -1 });
db.convoReactions.createIndex({ threadId: 1 });
```

These fields match the filters used by:

* `listThreadMessages`
* `listReplies`
* `listThreadReactions`
* `countThreadMessages`
* `countReplies`

Rule:
Design indexes to match the exact fields your Lookup queries use.

### 1.2 Use Range Queries for Time-Based Lookups

If you need to filter messages by time, use

```typescript
{ createdAt: { $gte: start, $lte: end } }
```

Example pattern (recommended if your overlay uses time-range queries):

```typescript
db.messages.find({
  threadId,
  createdAt: { $gte: startTime }
})
.sort({ createdAt: -1 })
.limit(50)
```

This ensures MongoDB uses timestamp indexes efficiently.

### 1.3 Combine Pagination With Indexed Sorts

When paginating through sorted data, combine `skip` / `limit` with an indexed sort key.

```typescript
async listThreadMessages(threadId, skip, limit) {
  return await this.messages
    .aggregate([
      { $match: { threadId } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ])
    .toArray();
}
```

Ensure the sort key (`createdAt`) matches an existing index to avoid in-memory sorting.

---

## 2. Common Anti-Patterns

| Problematic Pattern          | Description                                             | Recommended Fix                                     |
| ---------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| **Unindexed Filters**        | Querying on non-indexed fields causes full scans.       | Add composite indexes on frequent filter fields.    |
| **Regex or `$text` queries** | Regex searches prevent index usage.                     | Use prefix matches or precomputed lowercase fields. |
| **Large `$in` filters**      | `$in` with many values increases memory and CPU load.   | Batch requests or use intermediate caching.         |
| **Unbounded queries**        | Returning unbounded lists consumes memory.              | Always apply limit.                                 |
| **Sorting without an index** | Forces MongoDB to sort in memory.                       | Add compound index with your sort key.                 |

Examples to avoid:

```typescript
// ❌ DO NOT DO THIS
db.messages.find({}).sort({ createdAt: -1 });

// ❌ Breaks index usage
db.messages.find({ sender: { $regex: '^03' } });
```

---

## 3. MongoDB Indexing Best Practices

### 3.1 Use Compound Indexes

For overlays, most queries filter by a primary grouping field (such as threadId) and a secondary field (such as createdAt). Compound indexes drastically improve performance:

```js
// convoMessages collection
db.convoMessages.createIndex({ threadId: 1 });
db.convoMessages.createIndex({ parentMessageId: 1 });
db.convoMessages.createIndex({ threadId: 1, createdAt: -1 });

// convoReactions collection
db.convoReactions.createIndex({ threadId: 1 });

// convoThreads collection
db.convoThreads.createIndex({ threadId: 1 }, { unique: true });
```

These support efficient implmentations of:

**Messages in a thread**
```typescript
this.messages
  .find({ threadId })
  .sort({ createdAt: 1 });
```

**Replies to a message**
```typescript
this.messages
  .find({ parentMessageId })
  .sort({ createdAt: 1 });
```

**Latest messages across all threads**
Aggregation pipeline:
```typescript
[
  { $sort: { createdAt: -1 } },
  { $group: {
      _id: "$threadId",
      threadId: { $first: "$threadId" },
      txid: { $first: "$txid" },
      outputIndex: { $first: "$outputIndex" },
      sender: { $first: "$sender" },
      header: { $first: "$header" },
      encryptedPayload: { $first: "$encryptedPayload" },
      createdAt: { $first: "$createdAt" },
      threadName: { $first: "$threadName" },
      parentMessageId: { $first: "$parentMessageId" },
      uniqueId: { $first: "$uniqueId" }
  }},
  { $sort: { createdAt: -1 } },
  { $skip: skip },
  { $limit: limit }
]
```

All supported by the existing indexes.

---

### 3.2 Monitor Index Usage

Use MongoDB’s `explain()` command to verify index utilization:

Example (threads’ messages lookup):
```js
db.convoMessages
  .find({ threadId: "abc123" })
  .sort({ createdAt: -1 })
  .explain("executionStats");
```

Key metrics to monitor:

* `executionTimeMillis` - how long the query took
* `totalDocsExamined` - number of documents scanned
* `totalKeysExamined` - number of index entries scanned

**Goal:**
`totalDocsExamined` should be low (ideally equal to or close to limit) for all Convo queries.

### 3.3 Rebuild Indexes Periodically

Indexes can fragment over time, especially with:

* frequent inserts
* deletes (like messages deleted when spent)
* updates

Schedule index rebuilds during low-traffic periods:
```js
db.convoMessages.reIndex();
db.convoReactions.reIndex();
db.convoThreads.reIndex();
```

---

## 4. Measuring Query Performance

### 4.1 Use Built-In Mongo Metrics

MongoDB includes a lightweight profiler that records slow queries.
This is the easiest way for overlay authors to discover inefficient lookups.

Enable profiling for any query taking longer than 100 ms:

```js
db.setProfilingLevel(1, { slowms: 100 });
```

Slow query entries appear in the system.profile collection and can be inspected manually or exported to monitoring tools such as:

* Prometheus
* Grafana
* ELK / OpenSearch
* Custom dashboards

What to look for:

* High executionTimeMillis
* High totalDocsExamined (index not used)
* High totalKeysExamined (index scan too large)

Correctly indexed Convo queries should examine very small numbers of documents.

### 4.2 Add Overlay-Level Timing Logs

Your Lookup Service can log query timing directly at the overlay level.
This measures actual latency experienced by clients, not just database timings.

Example (Convo):

```typescript
const start = performance.now();
const messages = await this.storage.listThreadMessages(
  threadId,
  skip,
  limit
);
console.log(
  `[ls_convo] listThreadMessages(${threadId}) took ${performance.now() - start} ms`
);
```

You can add similar timing logs to:

* listThreadReactions
* listReplies
* listLatestMessages
*countThreadMessages
* countReplies

This makes it easy to identify:

* Query patterns that degrade at scale
* Missed indexes
* Inefficient aggregation pipelines

Overlay-level logs are invaluable for practical debugging because they show the exact request→response timing seen by apps like Convo Messenger.

### 4.3 Performance Visualization Tooling (Proposed)

Although not required for overlay authors today, you can add your own simple visualizations.

Potential enhancements include:

* **Query Time Dashboard**

    A small local dashboard showing average duration per lookup type (e.g., listThreadMessages, listReplies).

* **Slow Query Warnings**

    Log a warning if any Lookup query exceeds a threshold (e.g., 200 ms).

* **Index Usage Reports**

    A small script that uses explain("executionStats") on common queries and prints index efficiency.

These tools can help team-level debugging (e.g., Convo, Tempo, MetaMarket), but they are not a requirement for overlay authors and should not be confused with BSVA-level monitoring.

---

## 5. Practical Example: Convo Messenger

Convo Messenger provides a useful real-world example of how overlay query performance improves when Lookup queries are designed around indexed fields and predictable patterns.

Convo optimized its Lookup queries by:

Indexing fields used in queries, including:

- `threadId`
- `parentMessageId`
- `createdAt`
- compound index: `{ threadId: 1, createdAt: -1 }`

Using pagination everywhere, with sensible limits such as:

- `50` for message lists
- `100` for reaction lists

Ensuring query patterns always match existing indexes, including:

- filtering by `threadId`
- time ordering by `createdAt`
- grouping aggregation only after an indexed sort
- avoiding unbounded fetches (`find({})`)


These design choices ensure Convo’s Lookup Service remains stable and scales predictably, even as message volume grows.

This example illustrates how overlays can maintain efficient performance without requiring complex systems—just well-designed indexes, selective filters, and consistent pagination.

---

## 6. Recommendations Summary

| Area         | Recommendation                                              |
| ------------ | ----------------------------------------------------------- |
| Query Design | Always use indexed filters; avoid regex and `$in` scans.    |
| Indexing     | Add indexes that match your overlay’s query filters (e.g., `{ threadId, createdAt }`).    |
| Pagination   | Combine with indexed sorts to avoid in-memory sorting.      |
| Measurement  | Use MongoDB profiler and `explain('executionStats')` to detect slow queries.                  |
| Tooling      | Explore adding an Overlay Query Monitor to Overlay Express. |
| Logging      | Add timing logs in Lookup Services to measure real client-facing latency |

---

Next file: [`03-database-monitoring.md`](./03-database-monitoring.md) — focuses on database health, read-only access for debugging, and workflows for CARS admins.
