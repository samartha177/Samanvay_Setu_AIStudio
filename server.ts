/**
 * Production HTTP server for SAMANVAYSETU.
 *
 * Serves static frontend assets from dist/ and handles server-side API endpoints
 * including the AI Schema Mapper gateway.
 */

import { createServer, IncomingMessage, ServerResponse, request as httpRequest } from "node:http";
import { readFileSync, existsSync, statSync, createReadStream } from "node:fs";
import { join, extname } from "node:path";
import {
  suggestSchemaMappings,
  isAiMapperConfigured,
  getCandidateModels,
} from "./frontend/src/services/aiSchemaMapperService.ts";

const PORT = 3000;
const DIST_DIR = existsSync(join(process.cwd(), "dist"))
  ? join(process.cwd(), "dist")
  : join(process.cwd(), "frontend", "dist");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = req.url?.split("?")[0] || "/";

  // 1. AI Schema Mapper Status API
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

  // 2. AI Schema Mapping Suggestion Route
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

  // 3. Proxy all other /api/ requests to the FastAPI interoperability gateway on port 8005
  if (url.startsWith("/api/")) {
    const proxyReq = httpRequest(
      {
        hostname: "127.0.0.1",
        port: 8005,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      }
    );

    proxyReq.on("error", (err) => {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "FastAPI gateway unreachable",
          details: err.message,
        })
      );
    });

    req.pipe(proxyReq, { end: true });
    return;
  }

  // 4. Static Assets serving
  if (req.method === "GET" || req.method === "HEAD") {
    let filePath = join(DIST_DIR, url === "/" ? "index.html" : url);

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = join(DIST_DIR, "index.html");
    }

    if (existsSync(filePath)) {
      const ext = extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      createReadStream(filePath).pipe(res);
      return;
    }
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`SAMANVAYSETU production server listening on port ${PORT}`);
});
