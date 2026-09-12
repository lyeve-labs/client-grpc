# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-09-09

### Changed

- Documentation and shipped strings no longer carry em dashes, unicode
  ellipses or unicode bullets. Where a string is an error or a log line the
  wording changed and nothing else: status codes, machine-readable error codes
  and behaviour are untouched, so a client matching on a code is unaffected.
- An elision inside a code span now uses three ASCII periods, so a reader who
  copies one gets something their tool accepts.

## [0.2.1] - 2026-09-07

### Changed

- Every workflow action reference names the commit it resolves to rather than a
  tag, with the version beside it so the reference stays readable. This package
  publishes to npm and its workflows hold a publish token, and a tag is a moving
  reference the action author can repoint at any time.
- Built on Go 1.27.1, node 26.8.1 and pnpm 11.25.0. The organisation had been building
  on two Go versions at once, resolved by which directory you were standing in.
- Build scripts are named explicitly, which pnpm 11 requires before it runs them.

## [0.2.0] - 2026-09-02

### Fixed

- `createContent` and `updateContent` wrapped the record in a `data` envelope.
  The gRPC gateway decodes the whole body as the record - unlike the v1 Content
  API on port 3002, which does take an envelope - so every write produced an
  entry with a single field literally named `data`. The test asserted the
  envelope, which is why this passed.

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
