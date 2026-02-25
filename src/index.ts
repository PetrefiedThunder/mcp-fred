#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FredClient } from "./fred-client.js";

const apiKey = process.env.FRED_API_KEY;
if (!apiKey) {
  console.error("Error: FRED_API_KEY environment variable is required.");
  console.error("Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html");
  process.exit(1);
}

const fred = new FredClient({ apiKey });

const server = new McpServer({
  name: "mcp-fred",
  version: "1.0.0",
});

// --- Tools ---

server.tool(
  "search_series",
  "Search for FRED economic data series by keyword",
  {
    search_text: z.string().describe("Keywords to search for"),
    search_type: z.enum(["full_text", "series_id"]).optional().describe("Type of search (default: full_text)"),
    limit: z.number().min(1).max(1000).optional().describe("Max results (default: 20)"),
    offset: z.number().min(0).optional().describe("Result offset for pagination"),
    order_by: z.enum(["search_rank", "series_id", "title", "units", "frequency", "seasonal_adjustment", "realtime_start", "realtime_end", "last_updated", "observation_start", "observation_end", "popularity", "group_popularity"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
    tag_names: z.string().optional().describe("Semicolon-delimited tag names to filter by"),
  },
  async (params) => {
    const data = await fred.searchSeries({
      ...params,
      limit: params.limit ?? 20,
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_series",
  "Get metadata for a specific FRED series",
  {
    series_id: z.string().describe("FRED series ID (e.g. GDP, UNRATE, CPIAUCSL)"),
  },
  async (params) => {
    const data = await fred.getSeries(params);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_observations",
  "Get data points (observations) for a FRED series",
  {
    series_id: z.string().describe("FRED series ID"),
    observation_start: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    observation_end: z.string().optional().describe("End date (YYYY-MM-DD)"),
    limit: z.number().min(1).max(100000).optional().describe("Max observations (default: 10000)"),
    offset: z.number().min(0).optional().describe("Observation offset for pagination"),
    sort_order: z.enum(["asc", "desc"]).optional().describe("Sort by date (default: asc)"),
    units: z.enum(["lin", "chg", "ch1", "pch", "pc1", "pca", "cch", "cca", "log"]).optional().describe("Data transformation (lin=levels, pch=% change, etc.)"),
    frequency: z.enum(["d", "w", "bw", "m", "q", "sa", "a"]).optional().describe("Frequency aggregation"),
  },
  async (params) => {
    const data = await fred.getObservations(params);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_categories",
  "Browse the FRED category tree",
  {
    category_id: z.number().optional().describe("Category ID (default: 0 = root)"),
    children: z.boolean().optional().describe("Get child categories instead of the category itself"),
    series: z.boolean().optional().describe("Get series in this category"),
  },
  async (params) => {
    const data = await fred.getCategory(params);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_releases",
  "Get economic data releases and schedules",
  {
    dates: z.boolean().optional().describe("Get release dates instead of releases"),
    limit: z.number().min(1).max(1000).optional().describe("Max results"),
    offset: z.number().min(0).optional().describe("Result offset for pagination"),
    order_by: z.enum(["release_id", "name", "press_release", "realtime_start", "realtime_end"]).optional(),
    sort_order: z.enum(["asc", "desc"]).optional(),
  },
  async (params) => {
    const data = await fred.getReleases(params);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_popular_series",
  "Get recently updated/popular FRED series",
  {
    limit: z.number().min(1).max(1000).optional().describe("Max results (default: 20)"),
    offset: z.number().min(0).optional().describe("Result offset for pagination"),
  },
  async (params) => {
    const data = await fred.getSeriesUpdates({
      ...params,
      limit: params.limit ?? 20,
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
