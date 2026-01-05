import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withRevitConnection } from "../utils/ConnectionManager.js";

// Zod schema for 3D point (JZPoint)
const pointSchema = z.object({
  x: z.number().describe("X coordinate in millimeters"),
  y: z.number().describe("Y coordinate in millimeters"),
  z: z.number().describe("Z coordinate in millimeters"),
});

// Zod schema for dimension creation info
const dimensionCreationInfoSchema = z.object({
  elementIds: z.array(z.number()).min(1).describe("Element IDs to dimension between (at least 2 elements required for meaningful dimensions)"),
  startPoint: pointSchema.optional().describe("Dimension start point (mm). Optional - will be calculated from elements if not provided"),
  endPoint: pointSchema.optional().describe("Dimension end point (mm). Optional - will be calculated from elements if not provided"),
  linePoint: pointSchema.optional().describe("Dimension line point - location of dimension line (mm). If not provided, will be calculated automatically from element positions"),
  dimensionType: z.string().optional().default("Linear").describe("Dimension type (e.g., 'Linear', 'Angular', 'Radial')"),
  dimensionStyleId: z.number().optional().default(-1).describe("Dimension style ID. Use -1 for default style"),
  viewId: z.number().optional().default(-1).describe("View ID where dimension will be created. Use -1 for current active view"),
  referencePlaneName: z.string().optional().describe("Reference plane name in the Generic Model family to use for dimensioning. If not specified, a dialog will appear showing all available reference planes for the user to select. This determines the dimension orientation (horizontal/vertical)."),
  options: z.record(z.string(), z.any()).optional().default({}).describe("Additional dimension parameters as key-value pairs"),
});

export function registerCreateDimensionsTool(server: McpServer) {
  server.tool(
    "create_dimensions",
    "Create dimension annotations between elements to document spacing and alignment. Requires element IDs to dimension between. System will auto-calculate dimension lines and show a dialog for reference plane selection if needed.",
    {
      dimensions: z
        .array(dimensionCreationInfoSchema)
        .min(1)
        .describe("Array of dimension specifications to create. Each dimension defines start/end points, optional element IDs, and styling options"),
    },
    async (args, extra) => {
      try {
        const response = await withRevitConnection(async (revitClient) => {
          return await revitClient.sendCommand("create_dimensions", args);
        });

        // Format response
        if (response.Success) {
          const createdIds = response.Response || [];
          return {
            content: [
              {
                type: "text",
                text: `Successfully created ${createdIds.length} dimension(s). Element IDs: ${createdIds.join(", ")}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Dimension creation failed: ${response.Message}`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Dimension creation failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
