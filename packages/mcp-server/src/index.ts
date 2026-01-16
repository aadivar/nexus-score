#!/usr/bin/env node

/**
 * Nexus Score MCP Server
 * Provides Crossref metadata coverage scoring tools for AI assistants
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  CrossrefClient,
  calculateMemberScore,
  calculateJournalScore,
  DIMENSION_WEIGHTS,
  METRICS_BY_DIMENSION,
  type NexusScore,
} from '@nexus-score/core';

// Initialize Crossref client
const client = new CrossrefClient({
  mailto: process.env.CROSSREF_MAILTO || 'varma2friend@gmail.com',
});

// Create MCP server
const server = new McpServer({
  name: 'nexus-score',
  version: '1.0.0',
});

// ============ TOOLS ============

/**
 * Get Nexus Score for a Crossref member (publisher)
 */
server.tool(
  'get_member_score',
  'Get the Nexus Score for a Crossref member (publisher/organization) by ID. Returns a composite score (0-100), grade (A-F), dimension breakdown, and improvement recommendations.',
  {
    member_id: z
      .string()
      .describe('Crossref member ID (e.g., "286" for Oxford University Press, "311" for Wiley)'),
  },
  async ({ member_id }) => {
    try {
      const member = await client.getMember(member_id);
      const score = calculateMemberScore(member);

      return {
        content: [
          {
            type: 'text' as const,
            text: formatScoreResponse(score),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error fetching member ${member_id}: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Search for Crossref members by name
 */
server.tool(
  'search_members',
  'Search for Crossref members (publishers) by name. Returns member IDs that can be used with get_member_score.',
  {
    query: z.string().describe('Search query (publisher name, e.g., "Elsevier", "Nature")'),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe('Maximum number of results (default: 5, max: 20)'),
  },
  async ({ query, limit }) => {
    try {
      const actualLimit = Math.min(limit, 20);
      const result = await client.searchMembers(query, actualLimit);

      const members = result.items.map((m) => ({
        id: m.id,
        name: m['primary-name'],
        totalWorks: m.counts['total-dois'],
        location: m.location || 'Unknown',
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                total: result['total-results'],
                showing: members.length,
                members,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error searching members: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Get Nexus Score for a journal by ISSN
 */
server.tool(
  'get_journal_score',
  'Get the Nexus Score for a specific journal by ISSN. Returns scoring similar to member scores.',
  {
    issn: z.string().describe('Journal ISSN (e.g., "0028-0836" for Nature)'),
  },
  async ({ issn }) => {
    try {
      const journal = await client.getJournal(issn);
      const score = calculateJournalScore(journal);

      return {
        content: [
          {
            type: 'text' as const,
            text: formatScoreResponse(score),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error fetching journal ${issn}: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Compare scores between multiple publishers
 */
server.tool(
  'compare_members',
  'Compare Nexus Scores between multiple Crossref members (publishers). Useful for benchmarking.',
  {
    member_ids: z
      .array(z.string())
      .min(2)
      .max(5)
      .describe('Array of member IDs to compare (2-5 members)'),
  },
  async ({ member_ids }) => {
    try {
      const scores = await Promise.all(
        member_ids.map(async (id) => {
          const member = await client.getMember(id);
          return calculateMemberScore(member);
        })
      );

      const comparison = scores.map((score) => ({
        name: score.metadata.entityName,
        id: score.metadata.entityId,
        total: score.total,
        grade: score.grade,
        dimensions: {
          provenance: score.dimensions.provenance.percentage,
          people: score.dimensions.people.percentage,
          organizations: score.dimensions.organizations.percentage,
          funding: score.dimensions.funding.percentage,
          access: score.dimensions.access.percentage,
        },
        trend: score.trend.direction,
      }));

      // Sort by total score descending
      comparison.sort((a, b) => b.total - a.total);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ comparison }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error comparing members: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

/**
 * Get improvement recommendations for a member
 */
server.tool(
  'get_recommendations',
  'Get specific improvement recommendations for a Crossref member to increase their Nexus Score.',
  {
    member_id: z.string().describe('Crossref member ID'),
    limit: z
      .number()
      .optional()
      .default(5)
      .describe('Maximum recommendations to return (default: 5)'),
  },
  async ({ member_id, limit }) => {
    try {
      const member = await client.getMember(member_id);
      const score = calculateMemberScore(member);

      const recommendations = score.recommendations.slice(0, limit).map((rec) => ({
        priority: rec.priority,
        title: rec.title,
        dimension: rec.dimension,
        currentValue: `${rec.currentValue}%`,
        targetValue: `${rec.targetValue}%`,
        potentialGain: `+${rec.potentialGain} points`,
        howToImprove: rec.howToImprove,
        documentation: rec.documentationUrl,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                member: score.metadata.entityName,
                currentScore: score.total,
                currentGrade: score.grade,
                recommendations,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error getting recommendations: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============ RESOURCES ============

/**
 * Methodology documentation
 */
server.resource('methodology', 'nexus-score://methodology', async () => ({
  contents: [
    {
      uri: 'nexus-score://methodology',
      mimeType: 'text/markdown',
      text: `# Nexus Score Methodology

Nexus Score measures how well metadata contributes to Crossref's Research Nexus vision - connecting research outputs, people, organizations, and funders.

## Total Score: 100 points

### Provenance (${DIMENSION_WEIGHTS.provenance} points)
Links to prior work and research integrity.
${METRICS_BY_DIMENSION.provenance.map((m) => `- ${m.name}: ${m.weight} points`).join('\n')}

### People (${DIMENSION_WEIGHTS.people} points)
Author identification and disambiguation.
${METRICS_BY_DIMENSION.people.map((m) => `- ${m.name}: ${m.weight} points`).join('\n')}

### Organizations (${DIMENSION_WEIGHTS.organizations} points)
Institutional affiliations and linking.
${METRICS_BY_DIMENSION.organizations.map((m) => `- ${m.name}: ${m.weight} points`).join('\n')}

### Funding (${DIMENSION_WEIGHTS.funding} points)
Grant tracking and funder linking.
${METRICS_BY_DIMENSION.funding.map((m) => `- ${m.name}: ${m.weight} points`).join('\n')}

### Access (${DIMENSION_WEIGHTS.access} points)
Content availability and discoverability.
${METRICS_BY_DIMENSION.access.map((m) => `- ${m.name}: ${m.weight} points`).join('\n')}

## Grades
- **A** (80-100): Excellent metadata coverage
- **B** (65-79): Good, with room for improvement
- **C** (50-64): Adequate, significant gaps
- **D** (35-49): Needs substantial work
- **F** (0-34): Poor metadata coverage

## Data Source
Scores use pre-computed coverage statistics from the Crossref /members API endpoint, updated daily.
`,
    },
  ],
}));

// ============ HELPERS ============

function formatScoreResponse(score: NexusScore): string {
  const topRecs = score.recommendations.slice(0, 3);

  return JSON.stringify(
    {
      score: {
        total: score.total,
        grade: score.grade,
        trend: score.trend,
      },
      dimensions: Object.fromEntries(
        Object.entries(score.dimensions).map(([key, dim]) => [
          key,
          {
            score: dim.score,
            maxScore: dim.maxScore,
            percentage: dim.percentage,
          },
        ])
      ),
      entity: {
        name: score.metadata.entityName,
        id: score.metadata.entityId,
        type: score.metadata.entityType,
        totalWorks: score.metadata.totalWorks,
        currentWorks: score.metadata.currentWorks,
      },
      topRecommendations: topRecs.map((r) => ({
        priority: r.priority,
        title: r.title,
        potentialGain: r.potentialGain,
      })),
    },
    null,
    2
  );
}

// ============ START SERVER ============

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Nexus Score MCP server running');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
