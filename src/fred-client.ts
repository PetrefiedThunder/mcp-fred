/**
 * FRED API client with rate limiting.
 * Docs: https://fred.stlouisfed.org/docs/api/fred/
 */

const BASE_URL = "https://api.stlouisfed.org/fred";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;

interface RateLimiter {
  timestamps: number[];
}

const limiter: RateLimiter = { timestamps: [] };

/** Reset rate limiter (for testing). */
export function _resetRateLimiter(): void {
  limiter.timestamps.length = 0;
}

function checkRateLimit(): void {
  const now = Date.now();
  limiter.timestamps = limiter.timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (limiter.timestamps.length >= RATE_LIMIT_MAX) {
    throw new Error(
      `FRED API rate limit reached (${RATE_LIMIT_MAX} requests/minute). Try again shortly.`
    );
  }
  limiter.timestamps.push(now);
}

export interface FredClientOptions {
  apiKey: string;
}

export class FredClient {
  private apiKey: string;

  constructor(opts: FredClientOptions) {
    this.apiKey = opts.apiKey;
  }

  private async request(endpoint: string, params: Record<string, string> = {}): Promise<unknown> {
    checkRateLimit();

    const url = new URL(`${BASE_URL}/${endpoint}`);
    url.searchParams.set("api_key", this.apiKey);
    url.searchParams.set("file_type", "json");
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") {
        url.searchParams.set(k, v);
      }
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`FRED API error ${res.status}: ${text}`);
    }
    return res.json();
  }

  /** Search for economic data series by keyword. */
  async searchSeries(params: {
    search_text: string;
    search_type?: string;
    limit?: number;
    offset?: number;
    order_by?: string;
    sort_order?: string;
    tag_names?: string;
  }) {
    return this.request("series/search", {
      search_text: params.search_text,
      ...(params.search_type && { search_type: params.search_type }),
      ...(params.limit !== undefined && { limit: String(params.limit) }),
      ...(params.offset !== undefined && { offset: String(params.offset) }),
      ...(params.order_by && { order_by: params.order_by }),
      ...(params.sort_order && { sort_order: params.sort_order }),
      ...(params.tag_names && { tag_names: params.tag_names }),
    });
  }

  /** Get metadata for a specific series. */
  async getSeries(params: { series_id: string }) {
    return this.request("series", { series_id: params.series_id });
  }

  /** Get observations (data points) for a series. */
  async getObservations(params: {
    series_id: string;
    observation_start?: string;
    observation_end?: string;
    limit?: number;
    offset?: number;
    sort_order?: string;
    units?: string;
    frequency?: string;
  }) {
    return this.request("series/observations", {
      series_id: params.series_id,
      ...(params.observation_start && { observation_start: params.observation_start }),
      ...(params.observation_end && { observation_end: params.observation_end }),
      ...(params.limit !== undefined && { limit: String(params.limit) }),
      ...(params.offset !== undefined && { offset: String(params.offset) }),
      ...(params.sort_order && { sort_order: params.sort_order }),
      ...(params.units && { units: params.units }),
      ...(params.frequency && { frequency: params.frequency }),
    });
  }

  /** Get a category, its children, or series in a category. */
  async getCategory(params: {
    category_id?: number;
    children?: boolean;
    series?: boolean;
  }) {
    const id = String(params.category_id ?? 0);
    if (params.series) {
      return this.request("category/series", { category_id: id });
    }
    if (params.children) {
      return this.request("category/children", { category_id: id });
    }
    return this.request("category", { category_id: id });
  }

  /** Get all releases or recent release dates. */
  async getReleases(params: {
    dates?: boolean;
    limit?: number;
    offset?: number;
    order_by?: string;
    sort_order?: string;
  }) {
    const endpoint = params.dates ? "releases/dates" : "releases";
    return this.request(endpoint, {
      ...(params.limit !== undefined && { limit: String(params.limit) }),
      ...(params.offset !== undefined && { offset: String(params.offset) }),
      ...(params.order_by && { order_by: params.order_by }),
      ...(params.sort_order && { sort_order: params.sort_order }),
    });
  }

  /** Get recently updated series (proxy for "popular"). */
  async getSeriesUpdates(params: {
    limit?: number;
    offset?: number;
  }) {
    return this.request("series/updates", {
      ...(params.limit !== undefined && { limit: String(params.limit) }),
      ...(params.offset !== undefined && { offset: String(params.offset) }),
    });
  }
}
