// basically the brain of the app
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { exec } from "child_process";
import { promisify } from "util";
import { z } from "zod"; // Removed the broken 'config' import
import fs from "fs";
import path from "path";
const execAsync = promisify(exec);
const server = new McpServer({
    name: "MERN-Automator",
    description: "A simple MCP server for automating MERN stack tasks",
    version: "1.0.0",
});
// Tool 1: Run Command
server.tool("run_command", "Executes a terminal command (like npm install or mkdir) in the project directory", {
    command: z
        .string()
        .describe("The shell command to run, e.g. 'npm install' or 'mkdir myproject'"),
    cwd: z.string().describe("The directory where the command should execute"),
}, async ({ command, cwd }) => {
    try {
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
// Tool 2: Setup Database
server.tool("setupdatabase", "Creates a MongoDB connection file (db.js) with boilerplate code", {
    projectPath: z.string().describe("The absolute path of your project root"),
    dbName: z.string().describe("The name of your MongoDB database"),
}, async ({ projectPath, dbName }) => {
    try {
        const configDir = path.join(projectPath, "config");
        const filePath = path.join(configDir, "db.js");
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        // Updated to use 'import' instead of 'require' to match your express server
        const dbFileContent = `
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/${dbName}');
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;
`.trim();
        fs.writeFileSync(filePath, dbFileContent);
        return {
            content: [
                {
                    type: "text",
                    text: `Database connection file created at ${filePath}`,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error creating database connection file: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
// Tool 3: Setup Express Server
server.tool("setup_express", "Generates a boilerplate Express server.js file with CORS, dotenv, and DB connection", {
    projectPath: z.string().describe("The absolute path of your project root"),
}, async ({ projectPath }) => {
    try {
        const serverFilePath = path.join(projectPath, "server.js");
        const serverCode = `
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`.trim();
        fs.writeFileSync(serverFilePath, serverCode);
        return {
            content: [
                {
                    type: "text",
                    text: `Success! Created server.js in ${projectPath}`,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                { type: "text", text: `Lafda in setup_express: ${error.message}` },
            ],
            isError: true,
        };
    }
});
// Tool 4: Generate Mongoose Model
server.tool("setup_model", "Creates a standard Mongoose model file in a /models directory", {
    projectPath: z.string().describe("The absolute path of your project root"),
    modelName: z
        .string()
        .describe("The name of the model (e.g., 'User', 'Product')"),
}, async ({ projectPath, modelName }) => {
    try {
        const modelsDir = path.join(projectPath, "models");
        const capitalizedModel = modelName.charAt(0).toUpperCase() + modelName.slice(1);
        const filePath = path.join(modelsDir, `${capitalizedModel}Model.js`);
        if (!fs.existsSync(modelsDir)) {
            fs.mkdirSync(modelsDir, { recursive: true });
        }
        const modelCode = `
import mongoose from 'mongoose';

const ${modelName.toLowerCase()}Schema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        // Add more fields here...
    },
    {
        timestamps: true,
    }
);

const ${capitalizedModel} = mongoose.model('${capitalizedModel}', ${modelName.toLowerCase()}Schema);

export default ${capitalizedModel};
`.trim();
        fs.writeFileSync(filePath, modelCode);
        return {
            content: [
                {
                    type: "text",
                    text: `Success! Created ${capitalizedModel}Model.js`,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                { type: "text", text: `Lafda in setup_model: ${error.message}` },
            ],
            isError: true,
        };
    }
});
// 🚀 Start the server MUST be at the very bottom!
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=index.js.map