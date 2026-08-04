# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
