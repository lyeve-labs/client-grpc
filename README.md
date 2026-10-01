# @lyeve-labs/client-grpc

A typed HTTP client for the LyEve gRPC plugin's REST gateway. It calls the
plain HTTP/JSON mirror the plugin serves on its health sidecar (`GRPC_HEALTH_ADDR`,
default `127.0.0.1:3004`) with `fetch`. It never opens a gRPC connection and
does not speak HTTP/2 or protobuf. Use it when you want the gateway's paths and
types without a gRPC runtime. For a real gRPC client, generate one from the
plugin's `.proto` files or use `@grpc/grpc-js` against `GRPC_ADDR` (default
`127.0.0.1:3003`) with the `application/grpc+json` content subtype.

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

The same SchemaService and ContentService the plugin serves over gRPC, reached
over HTTP with the same `HttpClient` every other `@lyeve-labs` package uses.

---

## What's in the box

- **SchemaService:** list and get schemas through the REST gateway.
- **ContentService:** full CRUD for content entries. List, get, create, update, delete.
- **Same `HttpClient`:** reuses the same dependency-injection pattern as every other SDK.
- **Typed end-to-end:** request parameters and response shapes are fully typed.

## Requirements

- **Node 24** or newer
- **[@lyeve-labs/client](https://www.npmjs.com/package/@lyeve-labs/client)** `>=0.2.1`
- A running LyEve engine with the `grpc` plugin licensed, and its REST gateway
  reachable: the sidecar binds loopback until `GRPC_HEALTH_ADDR` names
  `0.0.0.0:<port>` and the port is mapped. Every request needs a bearer. The
  gateway refuses unauthenticated calls, and refuses every call when the
  engine has no JWT secret configured.

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
`/api/admin/*` or content `/api/v1/*` paths. Write bodies are the raw field map,
not the `{"data": {...}}` envelope the content API on `:3002` takes.

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
breaking changes bump the **minor** version. Additive changes bump the **patch**.
Every release is logged in [`CHANGELOG.md`](CHANGELOG.md).

## Contributing

Bug reports and feature requests are welcome. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the development setup and conventions.

## License

MIT. See [`LICENSE`](LICENSE).
