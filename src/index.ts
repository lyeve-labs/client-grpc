/**
 * Typed HTTP client for the LyEve gRPC plugin's REST gateway.
 *
 * The plugin serves a plain HTTP/JSON mirror of SchemaService and
 * ContentService on its health sidecar (GRPC_HEALTH_ADDR, default
 * 127.0.0.1:3004). Everything here goes over fetch. Nothing opens a gRPC
 * connection, so a consumer who needs HTTP/2 and protobuf generates a
 * client from the plugin's .proto files instead.
 *
 * HTTP paths use /api/schemas/* and /api/content/* (REST-transcoded),
 * not the admin /api/admin/* or content /api/v1/* paths.
 *
 * Usage:
 *   import { createClient } from '@lyeve-labs/client';
 *   import { listSchemas, getSchema, listContent } from '@lyeve-labs/client-grpc';
 *
 *   const client = createClient(
 *     (url, init) => fetch('http://localhost:3004' + url, init),
 *     { Authorization: 'Bearer xxx' }
 *   );
 *   const schemas = await listSchemas(client);
 */

import type { HttpClient } from "@lyeve-labs/client";

/**
 * A content type as the gateway serves it: its name and its stored
 * definition, as JSON.
 */
export interface GatewaySchema {
  name: string;
  definition: Record<string, unknown>;
}

/**
 * An entry as the gateway serves it: the stored row, flat. Each field sits
 * beside `id` under its column name (a relation under its column, such as
 * `author_id`), with the timestamps and the other system columns the content
 * type keeps. There is no `data` envelope. A localized read adds
 * `resolved_locale`, the locale that answered.
 */
export interface GatewayRow {
  id: string;
  [column: string]: unknown;
}

/** Options for a content read through the gateway. */
export interface GatewayReadOptions {
  /**
   * The language tag to serve rows in. When the localization plugin is on,
   * rows are served in it and a value that is not a language tag is refused
   * with 400. Without the plugin the value is ignored.
   */
  locale?: string;
}

// SchemaService

/** GET /api/schemas: list all schemas via gRPC gateway. */
export async function listSchemas(
  client: HttpClient,
): Promise<GatewaySchema[]> {
  // The gateway answers {"schemas": [...]}, the shape of ListSchemasResponse.
  const res = await client.get<{ schemas: GatewaySchema[] }>("/api/schemas");
  return res.schemas;
}

/** GET /api/schemas/{name} - get a single schema via gRPC gateway. */
export function getSchema(
  name: string,
  client: HttpClient,
): Promise<GatewaySchema> {
  return client.get<GatewaySchema>(`/api/schemas/${encodeURIComponent(name)}`);
}

// ContentService

/**
 * GET /api/content/{schema}: list rows via gRPC gateway, in id order. A
 * gateway from the gRPC plugin's next release on takes a limit of 1 to 500
 * (50 when left out) and an offset of 0 or more, and refuses a value that is
 * not an integer with 400. An earlier gateway drops both and serves the
 * first 50 rows.
 */
export async function listContent(
  schemaName: string,
  client: HttpClient,
  limit?: number,
  offset?: number,
  options: GatewayReadOptions = {},
): Promise<GatewayRow[]> {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  if (options.locale) params.set("locale", options.locale);
  const qs = params.toString();
  // The gateway answers {"items": [...]}, the shape of ListContentResponse.
  const res = await client.get<{ items: GatewayRow[] }>(
    `/api/content/${encodeURIComponent(schemaName)}${qs ? `?${qs}` : ""}`,
  );
  return res.items;
}

/** GET /api/content/{schema}/{id} - get a single entry via gRPC gateway. */
export async function getContent(
  schemaName: string,
  id: string,
  client: HttpClient,
  options: GatewayReadOptions = {},
): Promise<GatewayRow> {
  const qs = options.locale
    ? `?${new URLSearchParams({ locale: options.locale })}`
    : "";
  const res = await client.get<{ item: GatewayRow }>(
    `/api/content/${encodeURIComponent(schemaName)}/${encodeURIComponent(id)}${qs}`,
  );
  return res.item;
}

/**
 * POST /api/content/{schema} - create an entry via gRPC gateway.
 *
 * The gateway takes the record itself, with no envelope. This differs from the
 * v1 Content API on port 3002, which decodes `{"data": {...}}`. The gateway
 * decodes the whole body as the record. Sending an envelope here produced an
 * entry with one field literally named `data`.
 */
export async function createContent(
  schemaName: string,
  data: Record<string, unknown>,
  client: HttpClient,
): Promise<GatewayRow> {
  const res = await client.post<{ item: GatewayRow }>(
    `/api/content/${encodeURIComponent(schemaName)}`,
    data,
  );
  return res.item;
}

/**
 * PUT /api/content/{schema}/{id} - update an entry via gRPC gateway.
 *
 * As with create, the gateway takes the record itself and no envelope.
 */
export async function updateContent(
  schemaName: string,
  id: string,
  data: Record<string, unknown>,
  client: HttpClient,
): Promise<GatewayRow> {
  const res = await client.put<{ item: GatewayRow }>(
    `/api/content/${encodeURIComponent(schemaName)}/${encodeURIComponent(id)}`,
    data,
  );
  return res.item;
}

/** DELETE /api/content/{schema}/{id} - delete an entry via gRPC gateway. */
export async function deleteContent(
  schemaName: string,
  id: string,
  client: HttpClient,
): Promise<void> {
  // The gateway answers 200 {"deleted": id}, which carries nothing new.
  await client.delete<unknown>(
    `/api/content/${encodeURIComponent(schemaName)}/${encodeURIComponent(id)}`,
  );
}
