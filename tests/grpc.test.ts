import { describe, it, expect, vi } from "vitest";
import { createClient } from "@lyeve-labs/client";
import {
  listSchemas,
  getSchema,
  listContent,
  getContent,
  createContent,
  updateContent,
  deleteContent,
} from "../src/index.js";

// helpers

function mkClient(body: unknown = {}, status = 200) {
  const fetchFn = vi.fn(
    async (_url: string, _init: RequestInit): Promise<Response> =>
      new Response(status === 204 ? null : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  );
  return { client: createClient(fetchFn as unknown as typeof fetch), fetchFn };
}

// Each fixture is the body the gateway writes: the service response struct,
// encoded as it is.

const schema = {
  name: "article",
  definition: { name: "article", fields: [{ name: "title" }] },
};

const row = {
  id: "abc-123",
  title: "Test",
  author_id: "user-1",
  created_at: "2026-07-22T00:00:00Z",
  updated_at: "2026-07-22T00:00:00Z",
};

// SchemaService (REST-transcoded gRPC)

describe("SchemaService (REST gateway)", () => {
  describe("listSchemas()", () => {
    it("GETs /api/schemas and returns the schemas out of their wrapper", async () => {
      const { client, fetchFn } = mkClient({ schemas: [schema] });

      const result = await listSchemas(client);

      expect(result).toEqual([schema]);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/schemas");
      expect(init.method).toBe("GET");
    });

    it("returns an empty array when no schemas exist", async () => {
      const { client } = mkClient({ schemas: [] });

      expect(await listSchemas(client)).toEqual([]);
    });

    it("propagates API errors", async () => {
      const { client } = mkClient({ error: "unauthorized" }, 401);

      const err = await listSchemas(client).catch((e: unknown) => e);

      expect((err as any).status).toBe(401);
      expect((err as any).message).toBe("unauthorized");
    });
  });

  describe("getSchema()", () => {
    it("GETs /api/schemas/{name} and returns the name and definition", async () => {
      const { client, fetchFn } = mkClient(schema);

      const result = await getSchema("article", client);

      expect(result).toEqual(schema);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/schemas/article");
      expect(init.method).toBe("GET");
    });

    it("encodes special characters in schema name", async () => {
      const { client, fetchFn } = mkClient(schema);

      await getSchema("my schema", client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/schemas/my%20schema");
    });

    it("propagates a 404 error", async () => {
      const { client } = mkClient({ error: "schema not found" }, 404);

      const err = await getSchema("missing", client).catch((e: unknown) => e);

      expect((err as any).status).toBe(404);
      expect((err as any).message).toBe("schema not found");
    });
  });
});

// ContentService (REST-transcoded gRPC)

describe("ContentService (REST gateway)", () => {
  describe("listContent()", () => {
    it("GETs /api/content/{schema} and returns the rows out of their wrapper", async () => {
      const { client, fetchFn } = mkClient({ items: [row] });

      const result = await listContent("article", client);

      expect(result).toEqual([row]);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article");
      expect(init.method).toBe("GET");
    });

    it("includes limit and offset when both provided", async () => {
      const { client, fetchFn } = mkClient({ items: [] });

      await listContent("article", client, 10, 20);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article?limit=10&offset=20");
    });

    it("includes only limit when offset is omitted", async () => {
      const { client, fetchFn } = mkClient({ items: [] });

      await listContent("article", client, 5);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article?limit=5");
    });

    it("includes only offset when limit is omitted", async () => {
      const { client, fetchFn } = mkClient({ items: [] });

      await listContent("article", client, undefined, 10);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article?offset=10");
    });

    it("sends the locale beside the page", async () => {
      const { client, fetchFn } = mkClient({ items: [] });

      await listContent("article", client, 10, 0, { locale: "pt-BR" });

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article?limit=10&offset=0&locale=pt-BR");
    });

    it("sends filters, fields, populate and depth", async () => {
      const { client, fetchFn } = mkClient({ items: [] });

      await listContent("article", client, undefined, undefined, {
        filters: { featured: "true", "author id": "a&b" },
        fields: ["title", "author"],
        populate: ["author{name,bio}", "tags"],
        depth: 2,
      });

      const [url] = fetchFn.mock.calls[0];
      const sent = new URL(url, "http://gateway");
      expect(sent.pathname).toBe("/api/content/article");
      expect([...sent.searchParams]).toEqual([
        ["fields", "title,author"],
        ["populate", "author{name,bio},tags"],
        ["depth", "2"],
        ["filters[featured]", "true"],
        ["filters[author id]", "a&b"],
      ]);
    });

    it("sends no read option left empty", async () => {
      const { client, fetchFn } = mkClient({ items: [] });

      await listContent("article", client, undefined, undefined, {
        filters: {},
        fields: [],
        populate: [],
      });

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article");
    });

    it("encodes schema name in URL", async () => {
      const { client, fetchFn } = mkClient({ items: [] });

      await listContent("my schema", client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/my%20schema");
    });

    it("returns an empty array when no rows exist", async () => {
      const { client } = mkClient({ items: [] });

      expect(await listContent("article", client)).toEqual([]);
    });

    it("propagates API errors", async () => {
      const { client } = mkClient({ error: "forbidden" }, 403);

      const err = await listContent("article", client).catch((e: unknown) => e);

      expect((err as any).status).toBe(403);
    });
  });

  describe("getContent()", () => {
    it("GETs /api/content/{schema}/{id} and returns the row out of its wrapper", async () => {
      const { client, fetchFn } = mkClient({ item: row });

      const result = await getContent("article", "abc-123", client);

      expect(result).toEqual(row);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article/abc-123");
      expect(init.method).toBe("GET");
    });

    it("sends the locale", async () => {
      const localized = { ...row, title: "Teste", resolved_locale: "pt-BR" };
      const { client, fetchFn } = mkClient({ item: localized });

      const result = await getContent("article", "abc-123", client, {
        locale: "pt-BR",
      });

      expect(result.resolved_locale).toBe("pt-BR");
      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article/abc-123?locale=pt-BR");
    });

    it("sends fields, populate and depth beside the locale", async () => {
      const populated = { ...row, author: { id: "a-1", name: "Ann" } };
      const { client, fetchFn } = mkClient({ item: populated });

      const result = await getContent("article", "abc-123", client, {
        locale: "pt-BR",
        fields: ["title", "author"],
        populate: ["author"],
        depth: 0,
      });

      expect(result.author).toEqual({ id: "a-1", name: "Ann" });
      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe(
        "/api/content/article/abc-123?locale=pt-BR&fields=title%2Cauthor&populate=author&depth=0",
      );
    });

    it("encodes both schema name and id", async () => {
      const { client, fetchFn } = mkClient({ item: row });

      await getContent("my schema", "my id", client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/my%20schema/my%20id");
    });

    it("propagates a 404 error", async () => {
      const { client } = mkClient({ error: "entry not found" }, 404);

      const err = await getContent("article", "missing", client).catch(
        (e: unknown) => e,
      );

      expect((err as any).status).toBe(404);
      expect((err as any).message).toBe("entry not found");
    });
  });

  describe("createContent()", () => {
    it("POSTs the record to /api/content/{schema} and returns the stored row", async () => {
      const data = { title: "Test" };
      const { client, fetchFn } = mkClient({ item: row }, 201);

      const result = await createContent("article", data, client);

      expect(result).toEqual(row);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article");
      expect(init.method).toBe("POST");
      // The gateway takes the record itself, never a {"data": ...} envelope.
      expect(JSON.parse(init.body as string)).toEqual(data);
    });

    it("encodes schema name in URL", async () => {
      const { client, fetchFn } = mkClient({ item: row }, 201);

      await createContent("my schema", { title: "x" }, client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/my%20schema");
    });

    it("propagates validation errors", async () => {
      const { client } = mkClient({ error: "title is required" }, 400);

      const err = await createContent("article", {}, client).catch(
        (e: unknown) => e,
      );

      expect((err as any).status).toBe(400);
      expect((err as any).message).toBe("title is required");
    });
  });

  describe("updateContent()", () => {
    it("PUTs the fields to /api/content/{schema}/{id} and returns the stored row", async () => {
      const data = { title: "Updated" };
      const updated = { ...row, title: "Updated" };
      const { client, fetchFn } = mkClient({ item: updated });

      const result = await updateContent("article", "abc-123", data, client);

      expect(result).toEqual(updated);
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article/abc-123");
      expect(init.method).toBe("PUT");
      expect(JSON.parse(init.body as string)).toEqual(data);
    });

    it("encodes schema name and id in URL", async () => {
      const { client, fetchFn } = mkClient({ item: row });

      await updateContent("my schema", "my id", { title: "x" }, client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/my%20schema/my%20id");
    });

    it("propagates a 404 error", async () => {
      const { client } = mkClient({ error: "entry not found" }, 404);

      const err = await updateContent("article", "missing", {}, client).catch(
        (e: unknown) => e,
      );

      expect((err as any).status).toBe(404);
    });
  });

  describe("deleteContent()", () => {
    it("DELETEs /api/content/{schema}/{id} and resolves to undefined", async () => {
      const { client, fetchFn } = mkClient({ deleted: "abc-123" });

      const result = await deleteContent("article", "abc-123", client);

      expect(result).toBeUndefined();
      const [url, init] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/article/abc-123");
      expect(init.method).toBe("DELETE");
    });

    it("encodes schema name and id in URL", async () => {
      const { client, fetchFn } = mkClient({ deleted: "my id" });

      await deleteContent("my schema", "my id", client);

      const [url] = fetchFn.mock.calls[0];
      expect(url).toBe("/api/content/my%20schema/my%20id");
    });

    it("propagates API errors", async () => {
      const { client } = mkClient({ error: "forbidden" }, 403);

      const err = await deleteContent("article", "abc-123", client).catch(
        (e: unknown) => e,
      );

      expect((err as any).status).toBe(403);
    });
  });
});
