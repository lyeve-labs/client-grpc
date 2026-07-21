/**
 * gRPC gateway client for LyEve CMS.
 *
 * The CMS gRPC plugin (core-plugin-grpc) exposes a REST-transcoded mirror
 * on port :3004. This module provides typed functions for SchemaService and
 * ContentService operations.
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
import type { Schema, Content } from "@lyeve-labs/client";

// SchemaService

/** GET /api/schemas - list all schemas via gRPC gateway. */
export function listSchemas(client: HttpClient): Promise<Schema[]> {
  return client.get<Schema[]>("/api/schemas");
}

/** GET /api/schemas/{name} - get a single schema via gRPC gateway. */
export function getSchema(name: string, client: HttpClient): Promise<Schema> {
  return client.get<Schema>(`/api/schemas/${encodeURIComponent(name)}`);
}

// ContentService

/** GET /api/content/{schema} - list content entries via gRPC gateway. */
export function listContent(
  schemaName: string,
  client: HttpClient,
  limit?: number,
  offset?: number,
): Promise<Content[]> {
  const params = new URLSearchParams();
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  return client.get<Content[]>(
    `/api/content/${encodeURIComponent(schemaName)}${qs ? `?${qs}` : ""}`,
  );
}

/** GET /api/content/{schema}/{id} - get a single entry via gRPC gateway. */
export function getContent(
  schemaName: string,
  id: string,
  client: HttpClient,
): Promise<Content> {
  return client.get<Content>(
    `/api/content/${encodeURIComponent(schemaName)}/${encodeURIComponent(id)}`,
  );
}

/** POST /api/content/{schema} - create an entry via gRPC gateway. */
export function createContent(
  schemaName: string,
  data: Record<string, unknown>,
  client: HttpClient,
): Promise<Content> {
  return client.post<Content>(
    `/api/content/${encodeURIComponent(schemaName)}`,
    { data },
  );
}

/** PUT /api/content/{schema}/{id} - update an entry via gRPC gateway. */
export function updateContent(
  schemaName: string,
  id: string,
  data: Record<string, unknown>,
  client: HttpClient,
): Promise<Content> {
  return client.put<Content>(
    `/api/content/${encodeURIComponent(schemaName)}/${encodeURIComponent(id)}`,
    { data },
  );
}

/** DELETE /api/content/{schema}/{id} - delete an entry via gRPC gateway. */
export function deleteContent(
  schemaName: string,
  id: string,
  client: HttpClient,
): Promise<void> {
  return client.delete<void>(
    `/api/content/${encodeURIComponent(schemaName)}/${encodeURIComponent(id)}`,
  );
}
