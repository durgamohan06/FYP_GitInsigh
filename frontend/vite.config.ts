import { defineConfig, type ConfigEnv, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig(async ({ command }: ConfigEnv) => {
  const plugins: PluginOption[] = [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // TanStack Start server entry — SSR only, no API handlers
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
      proxy: {
        // Proxy all /api/* requests to the Express backend
        "/api": {
          target: process.env.VITE_API_URL ?? "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
