# BSV Overlay Services Engine

BSV BLOCKCHAIN | Overlay Services Engine

The Overlay Services Engine enables dynamic tracking and management of UTXO-based systems that work on top of the BSV blockchain.

## Table of Contents

1. [Objective](#objective)
2. [Getting Started](#getting-started)
3. [Features & Deliverables](#features--deliverables)
4. [Documentation](#documentation)
5. [Contribution Guidelines](#contribution-guidelines)
6. [Support & Contacts](#support--contacts)

## Objective

- Enable a general-purpose system for tracking UTXOs
- Let each service decide what UTXOs get into the system
- Provide an efficient global storage engine for UTXO data
- Let each lookup service dynamically respond to different types of queries
- Let each lookup service have its own, specialized storage engine for its unique needs

## Getting Started

### Choose the Right Package

Most application developers should start with the higher-level deployment tools:

- [`@bsv/overlay-express`](https://github.com/bsv-blockchain/overlay-express): opinionated Express wrapper for running overlay nodes with HTTP routes, health checks, storage configuration, SHIP/SLAP discovery, and GASP synchronization.
- [`@bsv/lars`](https://github.com/bsv-blockchain/lars): local runtime for BSV application projects that use `deployment-info.json`.
- [`@bsv/cars-cli`](https://github.com/bsv-blockchain/cars-cli): cloud deployment workflow for the same `deployment-info.json` project structure.

Use this package, `@bsv/overlay`, when you need direct control over the Overlay Services Engine itself, such as custom storage, custom broadcasting, or a non-Express host.

### Installation

For direct engine integration, install the engine with the current BSV TypeScript SDK:

```
npm i @bsv/overlay @bsv/sdk knex
```

### Basic Usage

Create an `Engine` with topic managers, lookup services, a storage implementation, and a chain tracker. The example below uses minimal in-memory stubs so the shape is clear. Production services should use durable storage, a real chain tracker, and a broadcaster appropriate for the target network.

```ts
import {
  Engine,
  type AdmittanceInstructions,
  type LookupFormula,
  type LookupQuestion,
  type Output,
  type Storage,
  type TopicManager,
  type LookupService
} from '@bsv/overlay'

const topicManager: TopicManager = {
  async identifyAdmissibleOutputs (): Promise<AdmittanceInstructions> {
    return {
      outputsToAdmit: [],
      coinsToRetain: []
    }
  },
  async getDocumentation () {
    return 'Admits outputs for the example topic.'
  },
  async getMetaData () {
    return {
      name: 'Example Topic Manager',
      shortDescription: 'Example topic manager',
      iconURL: '',
      version: '1.0.0',
      informationURL: ''
    }
  }
}

const lookupService: LookupService = {
  async outputAdmittedByTopic (): Promise<void> {},
  async outputSpent (): Promise<void> {},
  async outputEvicted (): Promise<void> {},
  async lookup (_question: LookupQuestion): Promise<LookupFormula> {
    return {
      type: 'formula',
      outpoints: []
    }
  },
  async getDocumentation () {
    return 'Looks up outputs admitted by the example topic.'
  },
  async getMetaData () {
    return {
      name: 'Example Lookup Service',
      shortDescription: 'Example lookup service',
      iconURL: '',
      version: '1.0.0',
      informationURL: ''
    }
  }
}

const storage: Storage = {
  async findOutput (): Promise<Output | null> { return null },
  async findOutputsForTransaction (): Promise<Output[]> { return [] },
  async findOutputsForTopic (): Promise<Output[]> { return [] },
  async findUTXOHistory (): Promise<Output[]> { return [] },
  async insertOutput (): Promise<void> {},
  async updateConsumedBy (): Promise<void> {},
  async updateTransactionBEEF (): Promise<void> {},
  async deleteOutput (): Promise<void> {},
  async startGASPSync (): Promise<void> {},
  async updateLastInteraction (): Promise<void> {},
  async getLastInteraction (): Promise<Date | null> { return null },
  async getSyncState (): Promise<unknown> { return undefined },
  async setSyncState (): Promise<void> {}
}

const engine = new Engine(
  { tm_example: topicManager },
  { ls_example: lookupService },
  storage,
  'scripts only',
  'https://example-overlay.example',
  [],
  [],
  undefined,
  undefined,
  { tm_example: false }
)

const topics = await engine.listTopicManagers()
const services = await engine.listLookupServiceProviders()
```

For deployable HTTP examples, use [`@bsv/overlay-express`](https://github.com/bsv-blockchain/overlay-express) and [`overlay-express-examples`](https://github.com/bsv-blockchain/overlay-express-examples). For local and cloud application runtime workflows, use LARS and CARS with the BRC-102 `deployment-info.json` project structure.

For lower-level engine examples, check out the [full documentation](#documentation).

The Overlay Services Engine is also richly documented with code-level annotations. This should show up well within editors like VSCode.

<!-- ## Documentation

[links to conceptsexamples and internals] -->

## Features & Deliverables

- UTXO Tracking
- History management and state tracking
- Lookup Services
- Storage engine abstractions
- Examples, HTTP wrapper, and docs through `@bsv/overlay-express`
- ARC callback handling through overlay hosts
- Distributed overlay availability advertisements with SHIP and SLAP
- Federated transaction synchronization with GASP

## Contribution Guidelines

We're always looking for contributors to help us improve the Engine. Whether it's bug reports, feature requests, or pull requests - all contributions are welcome.

1. **Fork & Clone**: Fork this repository and clone it to your local machine.
2. **Set Up**: Run `npm i` to install all dependencies.
3. **Make Changes**: Create a new branch and make your changes.
4. **Test**: Ensure all tests pass by running `npm test`.
5. **Commit**: Commit your changes and push to your fork.
6. **Pull Request**: Open a pull request from your fork to this repository.
For more details, check the [contribution guidelines](./CONTRIBUTING.md).

For information on past releases, check out the [changelog](./CHANGELOG.md). For future plans, check the [roadmap](./ROADMAP.md)!

## Support & Contacts

Project Owners: Thomas Giacomo, Darren Kellenschwiler, Jake Jones

Development Team Lead: Ty Everett

For questions, bug reports, or feature requests, please open an issue on GitHub or contact us directly.

## License

The license for the code in this repository is the Open BSV License. Refer to [LICENSE.txt](./LICENSE.txt) for the license text.

Thank you for being a part of the BSV Blockchain Overlay Services Project. Let's build the future of BSV Blockchain together!
