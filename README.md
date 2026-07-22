# @lyeve/cms-client-grpc

Typed functions for the CMS gRPC gateway. Targets the REST-transcoded gRPC gateway on port `:3004` (SchemaService and ContentService).

Depends on `@lyeve/cms-client` for the HTTP client layer and shared types.

## Install

```sh
pnpm add @lyeve/cms-client @lyeve/cms-client-grpc
```

## Usage

```ts
import { createClient } from '@lyeve/cms-client';
import { listSchemas, listContent, createContent } from '@lyeve/cms-client-grpc';

const client = createClient(
  (url, init) => fetch('http://localhost:3004' + url, init),
  { Authorization: 'Bearer <token>' },
);

// SchemaService
const schemas = await listSchemas(client);
const schema = await getSchema('articles', client);

// ContentService
const entries = await listContent('articles', client, 50, 0);
const article = await createContent('articles', { title: 'Hello' }, client);
```

## API

| Service | Function | HTTP | Description |
|---------|----------|------|-------------|
| SchemaService | `listSchemas(client)` | GET /api/schemas | List all schemas |
| SchemaService | `getSchema(name, client)` | GET /api/schemas/{name} | Get a schema |
| ContentService | `listContent(schema, client, limit?, offset?)` | GET /api/content/{schema} | List content entries |
| ContentService | `getContent(schema, id, client)` | GET /api/content/{schema}/{id} | Get a content entry |
| ContentService | `createContent(schema, data, client)` | POST /api/content/{schema} | Create an entry |
| ContentService | `updateContent(schema, id, data, client)` | PUT /api/content/{schema}/{id} | Update an entry |
| ContentService | `deleteContent(schema, id, client)` | DELETE /api/content/{schema}/{id} | Delete an entry |

Gateway paths use `/api/schemas/*` and `/api/content/*`; not the admin `/api/admin/*` or content `/api/v1/*` paths.

## License

MIT
