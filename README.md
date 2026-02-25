# mcp-fred

Access Federal Reserve Economic Data (FRED) — economic indicators, time series, and releases.

## Tools

| Tool | Description |
|------|-------------|
| `search_series` | Search for FRED economic data series by keyword |
| `get_series` | Get metadata for a specific FRED series |
| `get_observations` | Get data points (observations) for a FRED series |
| `get_categories` | Browse the FRED category tree |
| `get_releases` | Get economic data releases and schedules |
| `get_popular_series` | Get recently updated/popular FRED series |

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `FRED_API_KEY` | Yes | fred api key |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-fred.git
cd mcp-fred
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fred": {
      "command": "node",
      "args": ["/path/to/mcp-fred/dist/index.js"],
      "env": {
        "FRED_API_KEY": "your-fred-api-key"
      }
    }
  }
}
```

## Usage with npx

```bash
npx mcp-fred
```

## License

MIT
