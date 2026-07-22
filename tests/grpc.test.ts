import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@lyeve/cms-client';
import {
  listSchemas,
  getSchema,
  listContent,
  getContent,
  createContent,
  updateContent,
  deleteContent,
} from '../src/index.js';

// helpers

function mkClient(body: unknown = {}, status = 200) {
  const fetchFn = vi.fn(
    async (_url: string, _init: RequestInit): Promise<Response> =>
      new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  );
  return { client: createClient(fetchFn as unknown as typeof fetch), fetchFn };
}

// SchemaService (REST-transcoded gRPC)

describe('SchemaService (gRPC gateway)', () => {
  // listSchemas

  describe('listSchemas()', () => {
    it('GETs /api/schemas and returns the schema list', async () => {
      const schemas = [{ name: 'article', display_name: 'Article', fields: [] }];
      const { client, fetchFn } = mkClient(schemas);

      const result = await listSchemas(client);

      expect(result).toEqual(schemas);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/schemas');
      expect(init.method).toBe('GET');
    });

    it('returns an empty array when no schemas exist', async () => {
      const { client, fetchFn } = mkClient([]);

      const result = await listSchemas(client);

      expect(result).toEqual([]);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('propagates API errors', async () => {
      const { client } = mkClient({ error: 'unauthorized' }, 401);

      const err = await listSchemas(client).catch((e: unknown) => e);

      expect((err as any).status).toBe(401);
      expect((err as any).message).toBe('unauthorized');
    });
  });

  // getSchema

  describe('getSchema()', () => {
    it('GETs /api/schemas/{name} and returns the schema', async () => {
      const schema = { name: 'article', display_name: 'Article', fields: [] };
      const { client, fetchFn } = mkClient(schema);

      const result = await getSchema('article', client);

      expect(result).toEqual(schema);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/schemas/article');
      expect(init.method).toBe('GET');
    });

    it('encodes special characters in schema name', async () => {
      const { client, fetchFn } = mkClient({});

      await getSchema('my schema', client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/schemas/my%20schema');
    });

    it('propagates a 404 error', async () => {
      const { client } = mkClient({ error: 'schema not found' }, 404);

      const err = await getSchema('missing', client).catch((e: unknown) => e);

      expect((err as any).status).toBe(404);
      expect((err as any).message).toBe('schema not found');
    });
  });
});

// ContentService (REST-transcoded gRPC)

describe('ContentService (gRPC gateway)', () => {
  const sampleContent = {
    id: 'abc-123',
    schema_name: 'article',
    data: { title: 'Test' },
    created_at: '2026-07-22T00:00:00Z',
    updated_at: '2026-07-22T00:00:00Z',
  };

  // listContent

  describe('listContent()', () => {
    it('GETs /api/content/{schema} with no pagination params', async () => {
      const { client, fetchFn } = mkClient([sampleContent]);

      const result = await listContent('article', client);

      expect(result).toEqual([sampleContent]);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/article');
      expect(init.method).toBe('GET');
    });

    it('includes limit and offset when both provided', async () => {
      const { client, fetchFn } = mkClient([]);

      await listContent('article', client, 10, 20);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/article?limit=10&offset=20');
    });

    it('includes only limit when offset is omitted', async () => {
      const { client, fetchFn } = mkClient([]);

      await listContent('article', client, 5);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/article?limit=5');
    });

    it('includes only offset when limit is omitted', async () => {
      const { client, fetchFn } = mkClient([]);

      await listContent('article', client, undefined, 10);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/article?offset=10');
    });

    it('encodes schema name in URL', async () => {
      const { client, fetchFn } = mkClient([]);

      await listContent('my schema', client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/my%20schema');
    });

    it('returns empty array when no content exists', async () => {
      const { client } = mkClient([]);

      const result = await listContent('article', client);

      expect(result).toEqual([]);
    });

    it('propagates API errors', async () => {
      const { client } = mkClient({ error: 'forbidden' }, 403);

      const err = await listContent('article', client).catch((e: unknown) => e);

      expect((err as any).status).toBe(403);
    });
  });

  // getContent

  describe('getContent()', () => {
    it('GETs /api/content/{schema}/{id} and returns the entry', async () => {
      const { client, fetchFn } = mkClient(sampleContent);

      const result = await getContent('article', 'abc-123', client);

      expect(result).toEqual(sampleContent);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/article/abc-123');
      expect(init.method).toBe('GET');
    });

    it('encodes both schema name and id', async () => {
      const { client, fetchFn } = mkClient({});

      await getContent('my schema', 'my id', client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/my%20schema/my%20id');
    });

    it('propagates a 404 error', async () => {
      const { client } = mkClient({ error: 'entry not found' }, 404);

      const err = await getContent('article', 'missing', client).catch((e: unknown) => e);

      expect((err as any).status).toBe(404);
      expect((err as any).message).toBe('entry not found');
    });
  });

  // createContent

  describe('createContent()', () => {
    it('POSTs to /api/content/{schema} with data', async () => {
      const data = { title: 'New Article' };
      const { client, fetchFn } = mkClient(sampleContent);

      const result = await createContent('article', data, client);

      expect(result).toEqual(sampleContent);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/article');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual({ data });
    });

    it('encodes schema name in URL', async () => {
      const { client, fetchFn } = mkClient({});

      await createContent('my schema', {}, client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/my%20schema');
    });

    it('propagates validation errors', async () => {
      const { client } = mkClient({ error: 'title is required' }, 422);

      const err = await createContent('article', {}, client).catch((e: unknown) => e);

      expect((err as any).status).toBe(422);
      expect((err as any).message).toBe('title is required');
    });
  });

  // updateContent

  describe('updateContent()', () => {
    it('PUTs to /api/content/{schema}/{id} with data', async () => {
      const data = { title: 'Updated' };
      const updated = { ...sampleContent, data };
      const { client, fetchFn } = mkClient(updated);

      const result = await updateContent('article', 'abc-123', data, client);

      expect(result).toEqual(updated);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/article/abc-123');
      expect(init.method).toBe('PUT');
      expect(JSON.parse(init.body as string)).toEqual({ data });
    });

    it('encodes schema name and id in URL', async () => {
      const { client, fetchFn } = mkClient({});

      await updateContent('my schema', 'my id', {}, client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/my%20schema/my%20id');
    });

    it('propagates a 404 error', async () => {
      const { client } = mkClient({ error: 'entry not found' }, 404);

      const err = await updateContent('article', 'missing', {}, client).catch((e: unknown) => e);

      expect((err as any).status).toBe(404);
    });
  });

  // deleteContent

  describe('deleteContent()', () => {
    it('DELETEs /api/content/{schema}/{id} and returns undefined on 204', async () => {
      const { client, fetchFn } = mkClient(undefined, 204);

      const result = await deleteContent('article', 'abc-123', client);

      expect(result).toBeUndefined();
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/article/abc-123');
      expect(init.method).toBe('DELETE');
    });

    it('encodes schema name and id in URL', async () => {
      const { client, fetchFn } = mkClient(undefined, 204);

      await deleteContent('my schema', 'my id', client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe('/api/content/my%20schema/my%20id');
    });

    it('propagates API errors', async () => {
      const { client } = mkClient({ error: 'not found' }, 404);

      const err = await deleteContent('article', 'missing', client).catch((e: unknown) => e);

      expect((err as any).status).toBe(404);
      expect((err as any).message).toBe('not found');
    });
  });
});
