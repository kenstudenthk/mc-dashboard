import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Only GEMINI_API_KEY needs manual injection (not VITE_-prefixed).
      // All VITE_* vars are read natively by Vite from .env / .env.local.
      "process.env.GEMINI_API_KEY": JSON.stringify(
        env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY,
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== "true",
    },
  };
});
