# @nexus-score/mcp-server

MCP (Model Context Protocol) server for Crossref metadata coverage scoring. Use with Claude Desktop or any MCP-compatible AI assistant.

## Installation

```bash
npm install -g @nexus-score/mcp-server
```

Or use directly with npx:

```bash
npx @nexus-score/mcp-server
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nexus-score": {
      "command": "npx",
      "args": ["@nexus-score/mcp-server"],
      "env": {
        "CROSSREF_MAILTO": "your-email@example.com"
      }
    }
  }
}
```

**Config file locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

## Available Tools

### get_member_score
Get the Nexus Score for a Crossref member (publisher).

```
"Get the Nexus Score for Oxford University Press (member 286)"
```

### search_members
Search for Crossref members by name.

```
"Search for publishers named Elsevier"
```

### get_journal_score
Get the Nexus Score for a specific journal by ISSN.

```
"Get the score for Nature (ISSN 0028-0836)"
```

### compare_members
Compare scores between multiple publishers.

```
"Compare metadata coverage between Elsevier, Springer, and Wiley"
```

### get_recommendations
Get improvement recommendations for a publisher.

```
"What can PLOS do to improve their metadata coverage?"
```

## Resources

### methodology
Access the scoring methodology documentation.

```
"Explain the Nexus Score methodology"
```

## Environment Variables

- `CROSSREF_MAILTO` - Your email for Crossref's polite pool (recommended for better rate limits)

## Example Queries

1. "What's the Nexus Score for Springer Nature?"
2. "Compare metadata coverage between major academic publishers"
3. "Which publishers have the best ORCID coverage?"
4. "How can Cambridge University Press improve their metadata?"
5. "What does each dimension of the Nexus Score measure?"

## License

MIT
