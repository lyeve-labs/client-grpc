# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2026-09-02

### Changed

- CONTRIBUTING documents the branch model. It covered commits and releases but never said which branch a change starts from: work branches off `dev` and the PR goes back into `dev`, while `main` takes merges and carries the release tags.

## [0.1.3] - 2026-08-12

### Changed

- Move to node 24 and pnpm 10.33.4.
- Build against client 0.3.0, and raise the `@lyeve-labs/client` peer floor to
  0.2.1. The previous floor allowed 0.1.x, which was never published to the registry.

## [0.1.2] - 2026-08-04

### Fixed

- Split the `types` export condition so TypeScript resolves `.d.ts` under `import` and `.d.cts` under `require`.

## [0.1.1] - 2026-07-28

Published with no user-facing changes; repository tooling only.

## [0.1.0] - 2026-07-23

### Added

- Initial release.
- Typed functions for SchemaService operations (`listSchemas`, `getSchema`) via the CMS gRPC gateway.
- Typed functions for ContentService operations (`listContent`, `getContent`, `createContent`, `updateContent`, `deleteContent`) with pagination support.
- All functions use the core `HttpClient` interface, allowing drop-in use with the same auth and retry configuration as the REST and GraphQL clients.
