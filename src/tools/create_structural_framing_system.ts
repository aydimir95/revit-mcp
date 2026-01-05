import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withRevitConnection } from "../utils/ConnectionManager.js";

export function registerCreateStructuralFramingSystemTool(server: McpServer) {
  server.tool(
    "create_structural_framing_system",
    "Create a structural beam framing system in Revit within a rectangular boundary. Beams are automatically spaced at fixed intervals perpendicular to the specified direction edge. Supports configurable spacing, justification, and optional beam type selection. All coordinates are from project base point in millimeters (mm).",
    {
      levelName: z
        .string()
        .describe("Name of the level to place the beam system on (e.g., 'Level 1')"),
      xMin: z
        .number()
        .describe("Minimum X coordinate of rectangular boundary in millimeters"),
      xMax: z
        .number()
        .describe("Maximum X coordinate of rectangular boundary in millimeters"),
      yMin: z
        .number()
        .describe("Minimum Y coordinate of rectangular boundary in millimeters"),
      yMax: z
        .number()
        .describe("Maximum Y coordinate of rectangular boundary in millimeters"),
      directionEdge: z
        .enum(["bottom", "right", "top", "left"])
        .default("bottom")
        .describe("Which edge defines the beam direction: 'bottom' (beams run perpendicular, along Y), 'right' (along X), 'top' (along Y), or 'left' (along X)"),
      spacing: z
        .number()
        .positive()
        .describe("Spacing between beams in millimeters"),
      justify: z
        .enum(["beginning", "center", "end", "directionline"])
        .default("center")
        .describe("Beam justification along the direction edge: 'beginning', 'center', 'end', or 'directionline'"),
      beamTypeName: z
        .string()
        .optional()
        .describe("Beam family type name (e.g., 'W-Wide Flange-Column: W12x26'). If not provided, uses first available beam type"),
      elevation: z
        .number()
        .optional()
        .default(0)
        .describe("Elevation offset from level in millimeters"),
      is3d: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to create a 3D beam system"),
    },
    async (args, extra) => {
      const params = {
        levelName: args.levelName,
        xMin: args.xMin,
        xMax: args.xMax,
        yMin: args.yMin,
        yMax: args.yMax,
        directionEdge: args.directionEdge || "bottom",
        layoutRule: "fixed_distance", // v1: only fixed_distance supported
        spacing: args.spacing,
        justify: args.justify || "center",
        beamTypeName: args.beamTypeName,
        elevation: args.elevation || 0,
        is3d: args.is3d || false,
      };

      try {
        const response = await withRevitConnection(async (revitClient) => {
          return await revitClient.sendCommand("create_structural_framing_system", params);
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
              text: `Failed to create structural framing system: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
