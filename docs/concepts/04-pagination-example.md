# Pagination in Overlay Queries: Convo Messenger Example

[🏠 Home](../README.md) | [📚 API](../API.md) | [💡 Concepts](./README.md) | [📖 Examples](../examples/README.md) | [⚙️ Internal](../internal/README.md)

**Navigation:** [Overview](./00-overview.md) | [Best Practices](./01-best-practices.md) | [Query Performance](./02-query-performance.md) | [Database Monitoring](./03-database-monitoring.md) | [Pagination Example](./04-pagination-example.md) | [Recommendations Summary](./05-recommendations-summary.md)

---

## Overview

Pagination is one of the simplest and most effective techniques for ensuring overlay lookup performance remains stable as datasets grow.
Without pagination, queries that return lists—messages, reactions, or other records—can become increasingly slow and resource-intensive.

This document illustrates why pagination matters and uses Convo Messenger as a real example of how it improves performance.
It does not prescribe a required pattern or mandate changes; it simply shows how one overlay benefits from predictable, bounded queries.

---

## 1. Why Pagination Matters

Overlay datasets grow continuously. Without pagination:

* A lookup endpoint may return thousands of documents at once
* Memory usage spikes on both the server and the client
* Query latency increases as more documents accumulate
* Sorting happens in memory instead of using indexes

Pagination ensures each lookup returns only a small, fixed-size window of results.

**Benefits**

* Consistent performance regardless of dataset size
* Lower memory pressure
* Index-friendly access patterns
* Improved UX in applications that display messages or lists

---

## 2. How Convo Messenger Uses Pagination (Example)

Convo Messenger added pagination to all Lookup queries that return lists, including:

* listThreadMessages
* listLatestMessages
* listReplies
* listThreadReactions

Below is one example from Convo’s Lookup Service showing how `skip` and `limit` values are interpreted when provided:

```typescript
if (query.type === 'listThreadMessages') {
  const threadId = query.threadId ?? query.value?.threadId;
  if (!threadId) throw new Error("threadId required");

  const skip = query.skip ?? query.value?.skip ?? 0;
  const limit = query.limit ?? query.value?.limit ?? 50;

  const messages = await this.storage.listThreadMessages(threadId, skip, limit);
  return this.formatAsLookupAnswers(messages);
}
```

**Storage Layer Example (Convo)**

Convo’s storage layer performs an indexed and paginated fetch:

```typescript
async listThreadMessages(threadId: string, skip = 0, limit = 50) {
  const results = await this.messages
    .aggregate([
      { $match: { threadId } },
      { $sort: { createdAt: -1 } },   // newest → oldest (indexed)
      { $skip: skip },
      { $limit: limit }
    ])
    .toArray();

  return results.reverse(); // oldest → newest for UI ordering
}
```

This matches Convo’s existing index:

```typescript
db.convoMessages.createIndex({ threadId: 1, createdAt: -1 });
```

**Client-Side Integration**

In the frontend (React), pagination can be managed by maintaining a `page` or `offset` variable:

```typescript
const [messages, setMessages] = useState([]);
const [page, setPage] = useState(0);
const pageSize = 50;

async function loadNextPage() {
  const result = await lookup.query({
    service: 'convo_lookup',
    query: {
      type: 'listThreadMessages',
      threadId,
      skip: page * pageSize,
      limit: pageSize,
    }
  });

  setMessages([...messages, ...result]);
  setPage(page + 1);
}
```

This simple approach allows seamless infinite scrolling or “Load More” functionality.

Again, this is not a prescription—it simply demonstrates how Convo uses indexed pagination to maintain predictable performance.

---

## 3. Performance Impact (Convo Example)

After adding pagination to its lookup queries, Convo observed substantial performance improvements.

| Metric                     |  Before Pagination |       After Pagination |
| -------------------------- | -----------------: | ---------------------: |
| Average Query Time         |            ~420 ms |            **< 70 ms** |
| Memory Usage (per request) |             ~75 MB |             **< 8 MB** |
| CPU Load (peak)            |          Very High |         **Much Lower** |
| UI Latency                 | Noticeable stutter | **Instantaneous load** |

**Takeaways**
* Avoiding unbounded queries dramatically stabilizes performance
* Server resource usage becomes predictable
* Larger threads no longer degrade lookup time
* User experience improves without changing overlay protocols

---

## 4. Developer Notes (General Guidance)

### 4.1 Recommended Defaults

| Parameter | Recommended Value   | Notes                                                      |
| --------- | ------------------- | ---------------------------------------------------------- |
| `limit`   | 50                  | Reasonable for message lists; tweak based on dataset size. |
| `skip`    | 0                   | Always provide, even if zero.                              |
| sort    | `{ createdAt: -1 }` | Ensures chronological consistency.                         |

### 4.2 Index Alignment

For overlays that paginate ordered data, an index on the sort field is essential:

```js
{ threadId: 1, createdAt: -1 }
```
This avoids expensive in-memory sorts.

### 4.3 Cursor-Based Pagination (Optional)

Some overlays may use cursor-based pagination (e.g., createdAt > X) for large-scale workloads.
---

## 5. Visual Results (Convo Example)

Pagination allowed Convo to:
* Avoid returning entire threads at once
* Use MongoDB indexes effectively
* Keep lookup latency stable as message volume grew
* Implement infinite scroll UX without heavy data loads

This demonstrates how pagination helps overlays scale smoothly without requiring complicated architecture.

---

## 6. Recommendations Summary

| Area               | Recommendation                                       |
| ------------------ | ---------------------------------------------------- |
| Implementation     | Always bound list queries with pagination parameters |
| Client Integration | Incremental loading improves UX and stability        |
| Indexing           | Align indexes with sort and filter fields            |
| Optimization       | Cursor-based pagination can help for very large sets |
| Benchmarking       | Measure latency and memory before/after deployment   |

---

Next file: [`05-recommendations-summary.md`](./05-recommendations-summary.md) — Summarizes all proposed overlay improvements for BSVA documentation and Overlay Express feature suggestions.
