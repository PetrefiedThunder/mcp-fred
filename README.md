# mcp-fred

An [MCP](https://modelcontextprotocol.io) server that wraps the [Federal Reserve Economic Data (FRED)](https://fred.stlouisfed.org/) API for AI agents.

Access GDP, unemployment, inflation, interest rates, and 800,000+ economic time series directly from your AI assistant.

## Tools

| Tool | Description |
|------|-------------|
| `search_series` | Search for economic data series by keyword |
| `get_series` | Get metadata for a specific series (e.g. GDP, UNRATE) |
| `get_observations` | Get data points with optional date range, units, and frequency |
| `get_categories` | Browse the FRED category tree |
| `get_releases` | Get economic data releases and schedules |
| `get_popular_series` | Get recently updated/popular series |

## Setup

### 1. Get a free FRED API key

1. Go to [https://fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html)
2. Create a free account (or sign in)
3. Request an API key — it's instant and free

### 2. Install and build

```bash
git clone https://github.com/PetrefiedThunder/mcp-fred.git
cd mcp-fred
npm install
npm run build
```

### 3. Configure your MCP client

Add to your MCP client config (e.g. Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "fred": {
      "command": "node",
      "args": ["/path/to/mcp-fred/dist/index.js"],
      "env": {
        "FRED_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Examples

Once connected, ask your AI agent things like:

- "What's the current US unemployment rate?"
- "Show me GDP growth over the last 5 years"
- "Search for inflation-related series"
- "What economic data releases are coming up?"
- "Compare CPI and PCE price indices"

## Rate Limits

The FRED API allows 120 requests per minute. The client enforces this automatically.

## Development

```bash
npm run dev          # Run with tsx
npm test             # Run tests
npm run build        # Compile TypeScript
```

## License

MIT
