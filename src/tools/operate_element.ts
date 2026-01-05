import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withRevitConnection } from "../utils/ConnectionManager.js";

// Enum for element operation types
const operationTypeSchema = z.enum([
  "Select",
  "SelectionBox",
  "SetColor",
  "SetTransparency",
  "Delete",
  "Hide",
  "TempHide",
  "Isolate",
  "Unhide",
  "ResetIsolate",
]);

export function registerOperateElementTool(server: McpServer) {
  server.tool(
    "operate_element",
    "Modify element properties such as selection, visibility, color, and transparency. Supports operations like select, hide, isolate, delete, and color/transparency overrides.",
    {
      data: z
        .object({
          elementIds: z
            .array(z.number())
            .min(1)
            .describe("List of element IDs to operate on"),
          action: operationTypeSchema.describe(`Operation to perform:
  - Select: Select the elements in the UI
  - SelectionBox: Show selection box around elements
  - SetColor: Apply color override to elements
  - SetTransparency: Apply transparency override to elements
  - Delete: Delete the elements from the model
  - Hide: Hide elements in current view
  - TempHide: Temporarily hide elements
  - Isolate: Isolate elements (hide all others)
  - Unhide: Unhide previously hidden elements
  - ResetIsolate: Reset isolation (show all elements)`),
          transparencyValue: z
            .number()
            .int()
            .min(0)
            .max(100)
            .optional()
            .default(50)
            .describe(
              "Transparency value (0-100). Higher values = more transparent. Only used when action is SetTransparency"
            ),
          colorValue: z
            .array(z.number().int().min(0).max(255))
            .length(3)
            .optional()
            .default([255, 0, 0])
            .describe(
              "RGB color values [R, G, B] where each value is 0-255. Default is red [255, 0, 0]. Only used when action is SetColor"
            ),
        })
        .describe("Operation settings for element manipulation"),
    },
    async (args, extra) => {
      try {
        const response = await withRevitConnection(async (revitClient) => {
          return await revitClient.sendCommand("operate_element", args);
        });

        // Format response
        if (response.Success) {
          const action = args.data.action;
          const elementCount = args.data.elementIds.length;

          let message = `Successfully performed ${action} operation on ${elementCount} element(s).`;

          if (action === "SetColor") {
            const [r, g, b] = args.data.colorValue || [255, 0, 0];
            message += ` Applied color RGB(${r}, ${g}, ${b}).`;
          } else if (action === "SetTransparency") {
            message += ` Applied transparency: ${args.data.transparencyValue}%.`;
          }

          return {
            content: [
              {
                type: "text",
                text: message,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Operation failed: ${response.Message}`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Operation failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        };
      }
    }
  );
}
