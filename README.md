# @lyeve-labs/client-grpc

Typed functions for the CMS gRPC gateway. Targets the REST-transcoded gRPC
gateway on port `:3004`.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org)

```bash
pnpm add @lyeve-labs/client @lyeve-labs/client-grpc
```

```ts
import { createClient } from "@lyeve-labs/client";
import {
  listSchemas,
  listContent,
  createContent,
} from "@lyeve-labs/client-grpc";

const client = createClient(
  (url, init) => fetch("http://localhost:3004" + url, init),
  { Authorization: "Bearer <token>" },
);

const schemas = await listSchemas(client);
const entries = await listContent("articles", client, 50, 0);
```

Schema and Content services over gRPC. Same `HttpClient`, different transport.

---

## What's in the box

- **SchemaService:** list and get schemas over the gRPC gateway.
- **ContentService:** full CRUD for content entries. List, get, create, update, delete.
- **Same `HttpClient`:** reuses the same dependency-injection pattern as every other SDK.
- **Typed end-to-end:** request parameters and response shapes are fully typed.

## Requirements

- **Node 20** or newer
- **[@lyeve-labs/client](https://www.npmjs.com/package/@lyeve-labs/client)** `>=0.1.0`
- A running CMS gRPC gateway on port `:3004`

## Install

```bash
pnpm add @lyeve-labs/client @lyeve-labs/client-grpc
# or npm install @lyeve-labs/client @lyeve-labs/client-grpc
# or yarn add @lyeve-labs/client @lyeve-labs/client-grpc
```

## Use

```ts
import { createClient } from "@lyeve-labs/client";
import {
  listSchemas,
  getSchema,
  listContent,
  getContent,
  createContent,
  updateContent,
  deleteContent,
} from "@lyeve-labs/client-grpc";

const client = createClient(
  (url, init) => fetch("http://localhost:3004" + url, init),
  { Authorization: "Bearer <token>" },
);

// SchemaService
const schemas = await listSchemas(client);
const schema = await getSchema("articles", client);

// ContentService
const entries = await listContent("articles", client, 50, 0);
const article = await createContent("articles", { title: "Hello" }, client);
await updateContent("articles", article.id, { title: "Updated" }, client);
await deleteContent("articles", article.id, client);
```

## API

| Service        | Function                                       | HTTP                                |
| -------------- | ---------------------------------------------- | ----------------------------------- |
| SchemaService  | `listSchemas(client)`                          | `GET /api/schemas`                  |
| SchemaService  | `getSchema(name, client)`                      | `GET /api/schemas/{name}`           |
| ContentService | `listContent(schema, client, limit?, offset?)` | `GET /api/content/{schema}`         |
| ContentService | `getContent(schema, id, client)`               | `GET /api/content/{schema}/{id}`    |
| ContentService | `createContent(schema, data, client)`          | `POST /api/content/{schema}`        |
| ContentService | `updateContent(schema, id, data, client)`      | `PUT /api/content/{schema}/{id}`    |
| ContentService | `deleteContent(schema, id, client)`            | `DELETE /api/content/{schema}/{id}` |

Gateway paths use `/api/schemas/*` and `/api/content/*`. Not the admin
`/api/admin/*` or content `/api/v1/*` paths.

## Local development

```bash
pnpm install            # install dependencies
pnpm test               # run unit tests
pnpm check              # type-check
pnpm build              # tsup + publint -> dist/
```

## Project layout

```
src/
  index.ts           # public API
tests/               # vitest test suite
```

## Versioning

`@lyeve-labs/client-grpc` follows [SemVer](https://semver.org). While under `1.0`,
breaking changes bump the **minor** version; additive changes bump the **patch**.
Every release is logged in [`CHANGELOG.md`](CHANGELOG.md).

## Contributing

Bug reports and feature requests are welcome. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the development setup and conventions.

## License

MIT. See [`LICENSE`](LICENSE).
