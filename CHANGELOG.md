# CHANGELOG for `@bsv/overlay`

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Table of Contents

- [Unreleased](#unreleased)
- [0.5.4 - 2025-12-16](#054---2025-12-16)
- [0.5.3 - 2025-11-11](#053---2025-11-11)
- [0.5.0 - 2025-10-21](#050---2025-10-21)
- [0.4.8 - 2025-09-29](#048---2025-09-29)
- [0.4.7 - 2025-09-26](#047---2025-09-26)
- [0.4.6 - 2025-07-30](#046---2025-07-30)
- [0.4.5 - 2025-07-24](#111---2025-07-24)
- [0.4.4 - 2025-07-22](#111---2025-07-22)
- [0.4.3 - 2025-07-18](#110---2025-07-18)
- [0.0.1 - YYYY-MM-DD](#100---yyyy-mm-dd)

## [Unreleased]

### Added
- (Include new features or significant user-visible enhancements here.)

### Changed
- (Detail modifications that are non-breaking but relevant to the end-users.)

### Deprecated
- (List features that are in the process of being phased out or replaced.)

### Removed
- (Indicate features or capabilities that were taken out of the project.)

### Fixed
- (Document bugs that were fixed since the last release.)

### Security
- (Notify of any improvements related to security vulnerabilities or potential risks.)

---
## [0.5.4] - 2025-11-11

### Fixed
- (Document bugs that were fixed since the last release.)


## [0.5.3] - 2025-11-11

### Changed
- Moved broadcast before storage engine data updates in-case of broadcast failures.
- DB index to improve performance on UTXO lookups.

---

## [0.5.0] - 2025-10-21

### Changed
- Improved performance of BEEF hydration
- Added check for invalid input index and new deps in history traversal.
- Upgrade ts-sdk deps
- Updated Engine for GASP sync - ensures that includeBeef is set to true when finding an output, since hydrate() requires it.

## [0.4.5] - 2025-07-30

### Added
- Support suppressing ship/slap advertisements.

---

## [0.4.4] - 2025-07-22

### Changed

- score column type changed from float to bigint to handle large timestamp values

---

## [0.4.3] - 2025-07-18

### Changed

- Updated @bsv/sdk and @bsv/gasp-core deps
- Added score to outputs in the storage engine and across all methods which list outputs, to match gasp-core dep.

## [0.0.1] - YYYY-MM-DD

### Added
- Initial release of the BSV Blockchain Overlay Services Engine.

---

### Template for New Releases:

Replace `X.X.X` with the new version number and `YYYY-MM-DD` with the release date:

```
## [X.X.X] - YYYY-MM-DD

### Added
- 

### Changed
- 

### Deprecated
- 

### Removed
- 

### Fixed
- 

### Security
- 
```

Use this template as the starting point for each new version. Always update the "Unreleased" section with changes as they're implemented, and then move them under the new version header when that version is released.