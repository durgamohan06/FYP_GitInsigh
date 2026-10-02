import { nodeRepositoryManagement } from "./src/lib/repository-management";
import { defineConfig, type ConfigEnv, type Plugin, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import { nodeApiReposHandler } from "./src/lib/github-api";
import { nodeDashboardHandler } from "./src/lib/dashboard-api";
import { nodeRepoInsightsHandler } from "./src/lib/repo-insights";
import { nodeRepoDetailHandler } from "./src/lib/repo-detail-api";
import { nodeAuthRouter } from "./src/lib/github-oauth";
import { nodeGlobalSearchHandler, nodeNotificationsHandler } from "./src/lib/github-global-api";

const apiDevPlugin: Plugin = {
  name: "api-dev-routes",
  configureServer(server) {
    server.middlewares.use("/api/manage-repository", nodeRepositoryManagement);
    server.middlewares.use("/api/repos/detail", async (req, res) => {
      await nodeRepoDetailHandler(req, res);
    });
    server.middlewares.use("/api/repos/insights", async (req, res) => {
      await nodeRepoInsightsHandler(req, res);
    });
    server.middlewares.use("/api/dashboard", async (req, res) => {
      await nodeDashboardHandler(req, res);
    });
    server.middlewares.use("/api/repos", async (req, res) => {
      await nodeApiReposHandler(req, res);
    });
    server.middlewares.use("/api/search", async (req, res) => {
      await nodeGlobalSearchHandler(req, res);
    });
    server.middlewares.use("/api/notifications", async (req, res) => {
      await nodeNotificationsHandler(req, res);
    });
    server.middlewares.use("/api/auth", async (req, res, next) => {
      await nodeAuthRouter(req, res, next);
    });
  },
};

export default defineConfig(async ({ command }: ConfigEnv) => {
  const plugins: PluginOption[] = [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    apiDevPlugin,
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    react(),
  ];

  // Include nitro only during production builds
  if (command === "build") {
    try {
      const { nitro } = await import("nitro/vite");
      plugins.push(
        nitro({
          defaultPreset: "node-server",
        }),
      );
    } catch {
      // nitro is optional — skip if not installed
    }
  }

  return {
    plugins,
    css: { transformer: "lightningcss" as const },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    server: {
      host: "0.0.0.0",
      port: 8080,
    },
  };
});
