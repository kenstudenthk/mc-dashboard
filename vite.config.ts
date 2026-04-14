import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  // Merge VITE_* vars from both sources so all deployment paths work:
  // - process.env: Cloudflare Pages Git integration sets env vars here
  // - env (loadEnv): GitHub Actions writes a .env file that loadEnv reads
  const processEnvVite = Object.fromEntries(
    Object.entries(process.env).filter(
      ([k, v]) => k.startsWith("VITE_") && v !== undefined,
    ) as [string, string][],
  );
  const merged = { ...processEnvVite, ...env };
  const viteEnvDefines = Object.fromEntries(
    Object.entries(merged)
      .filter(([key]) => key.startsWith("VITE_"))
      .map(([key, val]) => [`import.meta.env.${key}`, JSON.stringify(val)]),
  );

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(
        env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY,
      ),
      ...viteEnvDefines,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
    },
  };
});
