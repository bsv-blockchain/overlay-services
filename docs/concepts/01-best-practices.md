# Overlay Best Practices for Developers

## Overview

This document provides **best practices for designing and maintaining overlay services** in the BSV ecosystem. It focuses on the practical concerns of developers who are building their **own overlays**—not on BSVA internals or modifications to Overlay Express.

The goal is to help developers make consistent and scalable decisions when implementing **Topic Managers**, **Lookup Services**, and associated **MongoDB storage layers**. Examples reference **Convo Messenger**, but the principles apply to all overlay-based systems.

---

## 1. Data Storage Principles

Overlay Lookup Services should store **small, structured metadata**, not entire payloads. The goal is fast, predictable querying.

### 1.1 Required Fields for Any Overlay

Every Lookup Service must store enough information to uniquely reference an on-chain output. This includes:

* **`txid`** — transaction ID containing the output
* **`outputIndex`** — index of the admitted output
* **`protocol`** — identifies which overlay protocol this entry belongs to

These fields ensure that applications can always locate the exact on-chain output referenced by the overlay.

### 1.2 Common Metadata Fields

In addition to required fields, overlays typically store small metadata extracted from PushDrop fields or derived from application logic.

Examples:

* **`timestamp` / `createdAt`** — when the message or record was created
* **`sender`** — sender's pubkey or DID
* **`threadId`** — group/thread identifier
* **`parentMessageId`** (optional) — for reply messages
* **reaction fields** (when applicable)

Example (Convo Messenger):

```ts
{
  txid: "abc123...",
  outputIndex: 0,
  protocol: [2, "convo"],
  threadId: "thread-xyz",
  sender: "035a1b...",
  createdAt: 1730000000000,
  encryptedPayload: [...], // ciphertext array
  header: [...],           // CurvePoint header
  uniqueId: "optional-value",
  parentMessageId: "optional-parent-txid"
}
```

**Note:** Convo stores *encryptedPayload* and *header* because these remain small arrays needed by the client. Overlays must avoid storing anything large (e.g., full media files).

### 1.3 When to Use UHRP

If an overlay needs to handle large data (text bodies, images, files), Lookup Services should **only store a UHRP reference**:

* Never store full file contents
* Never store large plaintext or ciphertext blobs
* Let the client fetch large data from UHRP when needed

Lookup Services should remain lightweight.

---

## 2. What Lookup Services Should *Not* Store

To maintain performance and predictable scaling, Lookup Services must avoid:

* Full PushDrop payloads or full scripts
* Large encrypted or plaintext message bodies
* Media files or binary attachments
* Identity certificates
* Redundant or duplicate on-chain data

**Rule of thumb:**
If it cannot be indexed efficiently, it does not belong in the Lookup DB.

---

## 3. Structuring Lookup Queries

### 3.1 Use Indexed, Selective Fields

All queries should filter using indexed, selective fields such as:

* `threadId`
* `sender`
* `parentMessageId`
* `createdAt`

Examples from Convo’s actual Mongo indexes:

```js
db.convoMessages.createIndex({ threadId: 1 })
db.convoMessages.createIndex({ parentMessageId: 1 })
db.convoMessages.createIndex({ threadId: 1, createdAt: -1 })
db.convoReactions.createIndex({ threadId: 1 })
```

### 3.2 Use Pagination Everywhere

List endpoints must support:

* **`skip`** — starting offset
* **`limit`** — number of items

Typical defaults:

* `limit = 50`
* `skip = 0`

Example (Convo):

```ts
const messages = await this.storage.listThreadMessages(threadId, skip, limit)
```

### 3.3 Avoid Expensive Query Patterns

Do **not**:

* Perform unbounded collection scans
* Query across all protocols
* Sort without an index
* Use `$regex` or `$text` filters

If complex queries are needed, break them into:

* Indexed filters
* Bounded pagination
* Incremental lookups

---

## 4. Topic Manager Best Practices

Topic Managers determine which outputs belong to your overlay. They must validate and parse data correctly.

Best practices:

1. **Validate admissible outputs** using PushDrop decoding.
2. **Store only necessary fields** extracted from PushDrop.
3. **Reject malformed or irrelevant outputs** early.
4. **Handle duplicate admissions** cleanly.
5. **Avoid heavy computation** inside the Topic Manager.

Example (Convo):

```ts
const decoded = PushDrop.decode(output.lockingScript)
const marker = Utils.toUTF8(fields[0])
const protocol = Utils.toUTF8(fields[1])

if (marker === 'convo' && protocol === 'tmconvo') {
  admissibleOutputs.push(index)
}
```

---

## 5. Data Retention and Cleanup

Overlays accumulate data continuously. Without retention logic, performance may degrade.

Common retention approaches:

* Delete old entries if your application doesn’t need them
* Archive long-lived data to another collection
* Rebuild indexes periodically
* Limit history for ephemeral overlays

Retention periods depend on the app:

* **Convo Messenger:** often stores all messages indefinitely
* **Task-based overlays:** may delete resolved items after 30–90 days

---

## 6. Summary of Recommendations

| Area            | Recommendation                                                   |
| --------------- | ---------------------------------------------------------------- |
| Required Fields | Always store `txid`, `outputIndex`, and protocol ID.             |
| Metadata        | Store only small, queryable fields (e.g., `threadId`, `sender`). |
| Large Data      | Use UHRP references instead of storing raw data.                 |
| Queries         | Use selective, indexed fields.                                   |
| Pagination      | Always include `skip` and `limit` in list endpoints.             |
| Topic Manager   | Validate and parse overlay-specific outputs only.                |
| Retention       | Prune or archive data as needed.                                 |

---

Next file: [`02-query-performance.md`](./02-query-performance.md) — how to design and optimize overlay queries.
