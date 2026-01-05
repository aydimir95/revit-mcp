import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withRevitConnection } from "../utils/ConnectionManager.js";

// Zod schema for 3D point (JZPoint)
const pointSchema = z.object({
  x: z.number().describe("X coordinate in millimeters"),
  y: z.number().describe("Y coordinate in millimeters"),
  z: z.number().describe("Z coordinate in millimeters"),
});

export function registerAiElementFilterTool(server: McpServer) {
  server.tool(
    "ai_element_filter",
    "Advanced AI-powered element filtering with category, type, family, spatial, and visibility filters. Returns detailed element information including geometry, parameters, and relationships.",
    {
      data: z.object({
        filterCategory: z
          .string()
          .optional()
          .describe(
            "Revit built-in category name (e.g., 'OST_Walls', 'OST_Doors', 'OST_Windows'). If not specified, no category filtering is applied"
          ),
        filterElementType: z
          .string()
          .optional()
          .describe(
            "Revit element type name (e.g., 'Wall', 'Autodesk.Revit.DB.Wall'). If not specified, no type filtering is applied"
          ),
        filterFamilySymbolId: z
          .number()
          .optional()
          .default(-1)
          .describe(
            "Family symbol ElementId to filter by. Use -1 for no family filtering. Only applies to element instances"
          ),
        includeTypes: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "Whether to include element types (e.g., wall types, door types) in results"
          ),
        includeInstances: z
          .boolean()
          .optional()
          .default(true)
          .describe(
            "Whether to include element instances (e.g., placed walls, doors) in results"
          ),
        filterVisibleInCurrentView: z
          .boolean()
          .optional()
          .default(false)
          .describe(
            "If true, only returns elements visible in the current view. Only applies to element instances"
          ),
        boundingBoxMin: pointSchema
          .optional()
          .describe(
            "Minimum point of spatial bounding box filter (mm). Must be used together with boundingBoxMax"
          ),
        boundingBoxMax: pointSchema
          .optional()
          .describe(
            "Maximum point of spatial bounding box filter (mm). Must be used together with boundingBoxMin"
          ),
        maxElements: z
          .number()
          .optional()
          .default(50)
          .describe("Maximum number of elements to return. Default is 50"),
      }).describe("Filter settings for element query"),
    },
    async (args, extra) => {
      try {
        const response = await withRevitConnection(async (revitClient) => {
          return await revitClient.sendCommand("ai_element_filter", args);
        });

        // Format response
        if (response.Success) {
          const elements = response.Response || [];
          let resultText = `Found ${elements.length} element(s) matching filter criteria.\n\n`;

          if (elements.length > 0) {
            resultText += "Elements:\n";
            elements.forEach((elem: any, index: number) => {
              resultText += `${index + 1}. ID: ${elem.id || elem.Id}, `;
              resultText += `Category: ${elem.category || "N/A"}, `;
              resultText += `Type: ${elem.typeName || elem.elementTypeName || "N/A"}\n`;
            });
          }

          return {
            content: [
              {
                type: "text",
                text: resultText,
              },
              {
                type: "text",
                text: `Full JSON response:\n${JSON.stringify(
                  response.Response,
                  null,
                  2
                )}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Element filter failed: ${response.Message}`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Element filter failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
