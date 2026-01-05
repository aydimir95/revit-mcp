import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withRevitConnection } from "../utils/ConnectionManager.js";

export function registerGetMaterialQuantitiesTool(server: McpServer) {
  server.tool(
    "get_material_quantities",
    "Calculate material quantities and takeoffs with area and volume calculations per material. Returns material data with area in square feet and volume in cubic feet. Useful for cost estimation, material planning, and quantity surveying.",
    {
      categoryFilters: z
        .array(z.string())
        .optional()
        .describe(
          "Optional list of category filters (e.g., ['OST_Walls', 'OST_Floors']). If not provided, all categories are included."
        ),
      selectedElementsOnly: z
        .boolean()
        .optional()
        .describe(
          "If true, only calculate quantities for currently selected elements"
        ),
    },
    async (args, extra) => {
      const params = {
        categoryFilters: args.categoryFilters || [],
        selectedElementsOnly: args.selectedElementsOnly || false,
      };

      try {
        const response = await withRevitConnection(async (revitClient) => {
          return await revitClient.sendCommand(
            "get_material_quantities",
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
              text: `Failed to get material quantities: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
