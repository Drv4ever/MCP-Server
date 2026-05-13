"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// basically the brain of the app
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const child_process_1 = require("child_process");
const util_1 = require("util");
const zod_1 = require("zod");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const server = new mcp_js_1.McpServer({
    name: "MERN-Automator",
    description: "A simple MCP server for automating MERN stack tasks",
    version: "1.0.0",
});
server.tool("run_command", "Executes a terminal command (like npm install or mkdir) in the project directory", {
    command: zod_1.z
        .string()
        .describe("The shell command to run, e.g. 'npm install' or 'mkdir myproject'"),
    cwd: zod_1.z.string().describe("The directory where the command should execute"),
}, async ({ command, cwd }) => {
    try {
        //  Security Check: Basic protection against dangerous commands
        const dangerousPatterns = [
            "rm -rf",
            "del /f /q",
            "rmdir /s /q",
            "format ",
        ];
        if (dangerousPatterns.some((pattern) => command.toLowerCase().includes(pattern))) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Dangerous command detected. Command execution aborted.",
                    },
                ],
                isError: true,
            };
        }
        const { stdout, stderr } = await execAsync(command, { cwd });
        return {
            content: [
                { type: "text", text: `Output:\n${stdout}` },
                {
                    type: "text",
                    text: stderr ? `Errors:\n${stderr}` : "No errors reported.",
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                { type: "text", text: `Lafda ho gaya bhai!!: ${error.message}` },
            ],
            isError: true,
        };
    }
});
// Start the server using Stdio transport
const transport = new stdio_js_1.StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map