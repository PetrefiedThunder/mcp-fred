import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after mocking
const { FredClient, _resetRateLimiter } = await import("../src/fred-client.js");

function mockJsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

describe("FredClient", () => {
  let client: InstanceType<typeof FredClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    _resetRateLimiter();
    client = new FredClient({ apiKey: "test-key" });
  });

  it("searchSeries sends correct params", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ seriess: [] }));

    await client.searchSeries({ search_text: "gdp", limit: 5 });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/fred/series/search");
    expect(url.searchParams.get("api_key")).toBe("test-key");
    expect(url.searchParams.get("file_type")).toBe("json");
    expect(url.searchParams.get("search_text")).toBe("gdp");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("getSeries sends correct params", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ seriess: [] }));

    await client.getSeries({ series_id: "GDP" });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/fred/series");
    expect(url.searchParams.get("series_id")).toBe("GDP");
  });

  it("getObservations with date range", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ observations: [] }));

    await client.getObservations({
      series_id: "UNRATE",
      observation_start: "2020-01-01",
      observation_end: "2023-12-31",
      units: "lin",
    });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/fred/series/observations");
    expect(url.searchParams.get("series_id")).toBe("UNRATE");
    expect(url.searchParams.get("observation_start")).toBe("2020-01-01");
    expect(url.searchParams.get("observation_end")).toBe("2023-12-31");
    expect(url.searchParams.get("units")).toBe("lin");
  });

  it("getCategory defaults to root", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ categories: [] }));

    await client.getCategory({});

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/fred/category");
    expect(url.searchParams.get("category_id")).toBe("0");
  });

  it("getCategory children", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ categories: [] }));

    await client.getCategory({ category_id: 32991, children: true });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/fred/category/children");
    expect(url.searchParams.get("category_id")).toBe("32991");
  });

  it("getCategory series", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ seriess: [] }));

    await client.getCategory({ category_id: 125, series: true });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/fred/category/series");
  });

  it("getReleases", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ releases: [] }));

    await client.getReleases({ limit: 10 });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/fred/releases");
    expect(url.searchParams.get("limit")).toBe("10");
  });

  it("getReleases dates", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ release_dates: [] }));

    await client.getReleases({ dates: true });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/fred/releases/dates");
  });

  it("getSeriesUpdates", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ seriess: [] }));

    await client.getSeriesUpdates({ limit: 5 });

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/fred/series/updates");
    expect(url.searchParams.get("limit")).toBe("5");
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ error_message: "Bad Request" }, 400));

    await expect(client.getSeries({ series_id: "INVALID" })).rejects.toThrow("FRED API error 400");
  });

  it("rate limits after 120 requests", async () => {
    // Make 120 successful requests
    for (let i = 0; i < 120; i++) {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ seriess: [] }));
    }

    const promises = [];
    for (let i = 0; i < 120; i++) {
      promises.push(client.getSeries({ series_id: "GDP" }));
    }
    await Promise.all(promises);

    // 121st should throw
    mockFetch.mockResolvedValueOnce(mockJsonResponse({ seriess: [] }));
    await expect(client.getSeries({ series_id: "GDP" })).rejects.toThrow("rate limit");
  });
});
