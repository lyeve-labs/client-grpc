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
- **Typed to the wire:** each function returns the gateway's answer out of its wrapper, typed as the gateway sends it.

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

| Service        | Function                                                 | HTTP                                |
| -------------- | -------------------------------------------------------- | ----------------------------------- |
| SchemaService  | `listSchemas(client)`                                    | `GET /api/schemas`                  |
| SchemaService  | `getSchema(name, client)`                                | `GET /api/schemas/{name}`           |
| ContentService | `listContent(schema, client, limit?, offset?, options?)` | `GET /api/content/{schema}`         |
| ContentService | `getContent(schema, id, client, options?)`               | `GET /api/content/{schema}/{id}`    |
| ContentService | `createContent(schema, data, client)`                    | `POST /api/content/{schema}`        |
| ContentService | `updateContent(schema, id, data, client)`                | `PUT /api/content/{schema}/{id}`    |
| ContentService | `deleteContent(schema, id, client)`                      | `DELETE /api/content/{schema}/{id}` |

Gateway paths use `/api/schemas/*` and `/api/content/*`. Not the admin
`/api/admin/*` or content `/api/v1/*` paths. Write bodies are the raw field map,
not the `{"data": {...}}` envelope the content API on `:3002` takes.

Answers come back the same way. A schema is a `GatewaySchema`, its name and
stored definition. An entry is a `GatewayRow`, the stored row, flat: each field
sits beside `id` under its column name (a relation under its column, such as
`author_id`), with the timestamps and the other system columns the content type
keeps, and no `data` envelope.

`listContent` returns rows in id order. A gateway from the gRPC plugin's next
release on takes a limit of 1 to 500 (50 when left out) and an offset of 0 or
more, and refuses a value that is not an integer with 400. An earlier gateway
drops both and serves the first 50 rows.

`listContent` and `getContent` take `{ locale }` last. When the localization
plugin is on, rows are served in that language, each carries `resolved_locale`,
and a value that is not a language tag is refused with 400. Without the plugin
the value is ignored.

From the gRPC plugin's next release on, the same options take `fields`,
`populate` and `depth`, and `listContent`'s take `filters`. An earlier gateway
ignores all four.

- `fields` keeps only the named fields of each row, beside `id`, `created_at`,
  `updated_at` and `resolved_locale`. A name the type does not declare, or one
  the caller may not read, is refused with 400.
- `populate` serves a relation as the record it points at: a belongs_to or
  has_one as a record or `null`, a has_many or many_to_many as a list, newest
  first. `author.company` reaches a relation of the related record, `*`
  populates every relation at its level, and `author{name}` keeps only the
  named fields of each record. A relation into a type the caller may not read
  is left out of the row.
- `depth` populates every relation, to that many levels, from 0 to 10.
- `filters` maps field names to the values those fields must equal. Each value
  is read by its field's type (`true` or `false`, a number, a UUID, a date
  written `2006-01-02`, an RFC 3339 time), and one its field cannot hold is
  refused with 400. A name the type does not declare is ignored, so a
  misspelled field filters nothing.

```ts
const posts = await listContent("posts", client, 20, 0, {
  filters: { featured: "true" },
  fields: ["title", "author"],
  populate: ["author{name}"],
});
```

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
