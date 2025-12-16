import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Support multiple build output layouts.
  // - Dev / some templates: server/public
  // - Bundled server + Vite build: dist/public
  // - Vite default: dist
  const candidates = [
    path.resolve(__dirname, "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "dist"),
    path.resolve(process.cwd(), "client", "dist"),
  ];

  const distPath = candidates.find((p) =>
    fs.existsSync(p) && fs.existsSync(path.resolve(p, "index.html")),
  );

  if (!distPath) {
    throw new Error(
      `Could not find the client build directory. Looked in:\n${candidates.join("\n")}`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
