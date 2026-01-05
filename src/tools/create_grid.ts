import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withRevitConnection } from "../utils/ConnectionManager.js";

export function registerCreateGridTool(server: McpServer) {
  server.tool(
    "create_grid",
    "Create a grid system in Revit with smart spacing generation and auto-naming. Supports alphabetic (A, B, C...) or numeric (1, 2, 3...) naming styles. Automatically handles duplicate names by incrementing (A -> A1). All coordinates are from project base point in millimeters (mm). X-axis grids are vertical lines, Y-axis grids are horizontal lines.",
    {
      xCount: z
        .number()
        .int()
        .positive()
        .describe("Number of vertical grid lines (X-axis grids)"),
      xSpacing: z
        .number()
        .positive()
        .describe("Spacing between X-axis grids in millimeters"),
      xStartLabel: z
        .string()
        .optional()
        .default("A")
        .describe("Starting label for X-axis grids (e.g., 'A' or '1')"),
      xNamingStyle: z
        .enum(["alphabetic", "numeric"])
        .optional()
        .default("alphabetic")
        .describe("Naming style for X-axis grids: 'alphabetic' or 'numeric'"),
      xStartPosition: z
        .number()
        .optional()
        .default(0)
        .describe("Starting position for first X-axis grid in millimeters from project origin"),
      yCount: z
        .number()
        .int()
        .positive()
        .describe("Number of horizontal grid lines (Y-axis grids)"),
      ySpacing: z
        .number()
        .positive()
        .describe("Spacing between Y-axis grids in millimeters"),
      yStartLabel: z
        .string()
        .optional()
        .default("1")
        .describe("Starting label for Y-axis grids (e.g., '1' or 'A')"),
      yNamingStyle: z
        .enum(["alphabetic", "numeric"])
        .optional()
        .default("numeric")
        .describe("Naming style for Y-axis grids: 'alphabetic' or 'numeric'"),
      yStartPosition: z
        .number()
        .optional()
        .default(0)
        .describe("Starting position for first Y-axis grid in millimeters from project origin"),
      xExtentMin: z
        .number()
        .optional()
        .default(0)
        .describe("Minimum extent along X-axis in millimeters (where Y-axis grids start)"),
      xExtentMax: z
        .number()
        .optional()
        .default(50000)
        .describe("Maximum extent along X-axis in millimeters (where Y-axis grids end)"),
      yExtentMin: z
        .number()
        .optional()
        .default(0)
        .describe("Minimum extent along Y-axis in millimeters (where X-axis grids start)"),
      yExtentMax: z
        .number()
        .optional()
        .default(50000)
        .describe("Maximum extent along Y-axis in millimeters (where X-axis grids end)"),
      elevation: z
        .number()
        .optional()
        .default(0)
        .describe("Z-coordinate elevation for grid lines in millimeters"),
    },
    async (args, extra) => {
      const params = {
        xCount: args.xCount,
        xSpacing: args.xSpacing,
        xStartLabel: args.xStartLabel || "A",
        xNamingStyle: args.xNamingStyle || "alphabetic",
        xStartPosition: args.xStartPosition || 0,
        yCount: args.yCount,
        ySpacing: args.ySpacing,
        yStartLabel: args.yStartLabel || "1",
        yNamingStyle: args.yNamingStyle || "numeric",
        yStartPosition: args.yStartPosition || 0,
        xExtentMin: args.xExtentMin || 0,
        xExtentMax: args.xExtentMax || 50000,
        yExtentMin: args.yExtentMin || 0,
        yExtentMax: args.yExtentMax || 50000,
        elevation: args.elevation || 0,
      };

      try {
        const response = await withRevitConnection(async (revitClient) => {
          return await revitClient.sendCommand("create_grid", params);
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
              text: `Failed to create grid system: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
