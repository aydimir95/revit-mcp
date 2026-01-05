import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withRevitConnection } from "../utils/ConnectionManager.js";

export function registerAnalyzeModelStatisticsTool(server: McpServer) {
  server.tool(
    "analyze_model_statistics",
    "Analyze model complexity with comprehensive statistics including element counts by category, type, family, and level. Returns total counts for elements, types, families, views, and sheets. Includes level-by-level breakdown of element distribution. Useful for project analysis and reporting.",
    {
      includeDetailedTypes: z
        .boolean()
        .optional()
        .describe(
          "If true, includes detailed breakdown of types and families within each category"
        ),
    },
    async (args, extra) => {
      const params = {
        includeDetailedTypes:
          args.includeDetailedTypes !== undefined
            ? args.includeDetailedTypes
            : true,
      };

      try {
        const response = await withRevitConnection(async (revitClient) => {
          return await revitClient.sendCommand(
            "analyze_model_statistics",
            params
          );
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to analyze model statistics: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
