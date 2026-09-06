import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import {
  suggestSchemaMappings,
  isAiMapperConfigured,
  getCandidateModels,
} from "./src/services/aiSchemaMapperService";

function aiSchemaMapperPlugin(): Plugin {
  return {
    name: "ai-schema-mapper-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0] || "";

        // Status route
        if (req.method === "GET" && (url === "/api/v1/ai/status" || url === "/api/ai/status")) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              aiAvailable: isAiMapperConfigured(),
              model: getCandidateModels()[0],
              deterministicAuthoritative: true,
              registryVersion: "mapping-registry-v1",
            })
          );
          return;
        }

        // Schema suggestion mapping route
        if (
          req.method === "POST" &&
          (url === "/api/v1/ai/suggest-mapping" || url === "/api/ai/suggest-mapping")
        ) {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });

          req.on("end", async () => {
            try {
              let parsedBody: any = {};
              if (body.trim()) {
                parsedBody = JSON.parse(body);
              }

              const payloadToAnalyze = parsedBody.schema || parsedBody.rawSchema || parsedBody;
              const result = await suggestSchemaMappings(payloadToAnalyze);

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  success: false,
                  suggestions: [],
                  error: "AI suggestions unavailable.",
                  details: "Deterministic mapping remains available through mapping-registry-v1.",
                  aiAvailable: isAiMapperConfigured(),
                  source: "gemini_ai_suggestion",
                  timestamp: new Date().toISOString(),
                })
              );
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), aiSchemaMapperPlugin()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8005",
        changeOrigin: true,
      },
    },
  },
});
