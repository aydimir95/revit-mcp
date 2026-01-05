import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withRevitConnection } from "../utils/ConnectionManager.js";

export function registerExportRoomDataTool(server: McpServer) {
  server.tool(
    "export_room_data",
    "Extract all rooms with detailed properties including area, volume, perimeter, and parameters. Returns room data with measurements in imperial units (square feet, cubic feet). Useful for space planning and area calculations.",
    {
      includeUnplacedRooms: z
        .boolean()
        .optional()
        .describe("Include rooms that have not been placed in the model"),
      includeNotEnclosedRooms: z
        .boolean()
        .optional()
        .describe("Include rooms that are not properly enclosed by walls"),
    },
    async (args, extra) => {
      const params = {
        includeUnplacedRooms: args.includeUnplacedRooms || false,
        includeNotEnclosedRooms: args.includeNotEnclosedRooms || false,
      };

      try {
        const response = await withRevitConnection(async (revitClient) => {
          return await revitClient.sendCommand("export_room_data", params);
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
              text: `Failed to export room data: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
