# Overlay Database Monitoring and Debugging

[🏠 Home](../README.md) | [📚 API](../API.md) | [💡 Concepts](./README.md) | [📖 Examples](../examples/README.md) | [⚙️ Internal](../internal/README.md)

**Navigation:** [Overview](./00-overview.md) | [Best Practices](./01-best-practices.md) | [Query Performance](./02-query-performance.md) | [Database Monitoring](./03-database-monitoring.md) | [Pagination Example](./04-pagination-example.md) | [Recommendations Summary](./05-recommendations-summary.md)

---

## Overview

Monitoring and debugging overlay databases helps ensure reliability, correctness, and predictable performance.
As overlays grow, developers benefit from having ways to inspect what their Lookup Service is storing and validate that Topic Manager admission logic is working as intended.

This document outlines optional strategies for:

* Providing **safe, read-only** inspection of Lookup data
* Building **debugging workflows** during overlay development
* Tracking **basic performance and health metrics**
* Ensuring correctness without exposing sensitive data or modifying overlay protocols

These recommendations are intended for **overlay developers**, not system administrators of BSVA infrastructure.

---

## 1. Goals

Overlay authors may want to:

* Verify what data is stored after Topic Manager admission
* Inspect the parsed documents produced by PushDrop decoding
* Measure lookup latency or query efficiency
* Debug message ingestion, reactions, or thread activity during development
* Provide trusted team members with read-only visibility in test or staging environments

All monitoring discussed here is optional and applies only to the overlay developer’s own deployment.

---

## 2. Read-Only Access for Debugging

### 2.1 Purpose

Read-only visibility is useful during development or internal debugging because it allows developers to:

* Confirm that the Lookup Service stored the expected metadata
* Inspect whether fields such as `threadId`, `createdAt`, or `parentMessageId` were parsed correctly
* Understand why a transaction may not appear in query results

### 2.2 Implementation Options

Overlay authors can choose from several approaches depending on their internal workflow.

#### Option A: MongoDB Read-Only Role

MongoDB allows creation of roles that grant read-only access to specific collections:

```js
db.createUser({
  user: "overlayReader",
  pwd: "strongpassword",
  roles: [
    { role: "read", db: "overlaydb" }
  ]
});
```

This is useful for:

* Internal developers
* Debugging in staging environments
* Letting trusted team members inspect lookup data

#### Option B: Internal Read-Only Endpoint

Some teams choose to expose a controlled debug route during development:

```typescript
router.get('/debug/messages', async (req, res) => {
  const threadId = req.query.threadId;
  const results = await storage.listThreadMessages(threadId, 0, 25);
  res.json(results);
});
```

**Important:**
Such endpoints must not be exposed publicly. They should be protected with:

* API keys
* Admin tokens
* IP allowlists
* Or disabled entirely in production

This is entirely optional and depends on each developer’s debugging workflow.

---

## 3. Health and Performance Metrics

These metrics are optional but useful during development or debugging.

### 3.1 Basic Metrics

Overlay authors may choose to track:

* Collection size and document count
* Index size and index efficiency
* Average query execution time for common lookups
* Latency from Topic Manager admission to Lookup write
* Count of decode or parse failures

These can be logged periodically or exported to monitoring tools like Prometheus or Grafana if desired.

Example minimal metric:

```typescript
app.get('/metrics', async (req, res) => {
  const stats = await db.collection('convoMessages').stats();
  res.send(`convo_messages_bytes ${stats.size}\n`);
});
```

### 3.2 Transaction Admission Tracking

During development, Topic Managers can log admission decisions:

```typescript
console.log(`[tm_convo] admitted output ${txid}:${vout}`);
```

This helps correlate:

* The BEEF transaction
* Decoded PushDrop fields
* The resulting Lookup Service document

This logging is optional and purely for debugging the overlay’s own ingestion logic.

---

## 4. Debugging Workflow Example

A typical overlay debugging workflow might look like:

1. Identify the txid of a message that should appear in the UI
2. Query the Lookup data (using read-only DB access or internal endpoint)
3. Verify that the Topic Manager correctly decoded the PushDrop fields
4. Ensure Lookups return expected results (e.g., thread messages, replies, reactions)
5. If performance issues appear, check index usage via `explain("executionStats")`
6. If admission issues appear, review Topic Manager logs

This workflow helps developers confirm correctness without modifying protocol-level logic.

---

## 5. Optional Tools and Enhancements

These tools are optional and useful only in development environments.

### 5.1 Overlay Health Dashboard

A lightweight web interface integrated into Overlay Express that would:

* Display real-time query performance (e.g., avg lookup latency)
* Show admission rates per Topic Manager
* Track DB growth and index efficiency
* Provide a query console for authorized users

This is helpful for overlay teams during debugging or feature development.

### 5.2 Integration With Existing Mongo Tooling

Developers can use existing Mongo tools with read-only credentials:

* Mongo Express
* MongoDB Compass
* Atlas Monitoring

This allows safe browsing of Lookup documents without risk of modification.

---

## 6. Security Considerations

To avoid security risks:

* Restrict read-only access to internal team members
* Do not expose debugging endpoints publicly
* Use authentication (API keys, tokens) for any admin routes
* Avoid logging user data such as:
  * CurvePoint headers
  * Encrypted payloads
  * Identity certificates
  * Private metadata

Logs should focus on metadata only, such as txid, threadId, and timestamps.

---

## 7. Summary of Recommendations

| Area        | Recommendation                                                     |
| ----------- | ------------------------------------------------------------------ |
| Read Access | Provide secure read-only access for overlay and CARS admins.       |
| Metrics     | Track query latency, DB size, and failed transactions.             |
| Logging     | Record admission flow from Topic Manager to Lookup.                |
| Tools       | Use Mongo Express or Compass with read-only roles.                 |
| Security    | Restrict debugging endpoints and sanitize data.                    |

---

Next file: [`04-pagination-example.md`](./04-pagination-example.md) — Demonstrates performance improvements from pagination in Convo Messenger overlay queries.
