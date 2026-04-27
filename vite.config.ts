import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(
        env.GEMINI_API_KEY ?? process.env.GEMINI_API_KEY,
      ),
      // Explicitly inject all VITE_* vars so they are reliably bundled
      // regardless of Vite's native .env loading behaviour in CI.
      "import.meta.env.VITE_API_ORDERS_URL": JSON.stringify(env.VITE_API_ORDERS_URL ?? ""),
      "import.meta.env.VITE_API_CUSTOMERS_URL": JSON.stringify(env.VITE_API_CUSTOMERS_URL ?? ""),
      "import.meta.env.VITE_API_PERMISSIONS_URL": JSON.stringify(env.VITE_API_PERMISSIONS_URL ?? ""),
      "import.meta.env.VITE_API_ORDER_TIMELINE_URL": JSON.stringify(env.VITE_API_ORDER_TIMELINE_URL ?? ""),
      "import.meta.env.VITE_API_AUDIT_LOGS_URL": JSON.stringify(env.VITE_API_AUDIT_LOGS_URL ?? ""),
      "import.meta.env.VITE_API_QUICK_LINKS_URL": JSON.stringify(env.VITE_API_QUICK_LINKS_URL ?? ""),
      "import.meta.env.VITE_API_SERVICE_ACCOUNTS_URL": JSON.stringify(env.VITE_API_SERVICE_ACCOUNTS_URL ?? ""),
      "import.meta.env.VITE_API_ORDER_STEPS_URL": JSON.stringify(env.VITE_API_ORDER_STEPS_URL ?? ""),
      "import.meta.env.VITE_API_GET_PAGE_URL": JSON.stringify(env.VITE_API_GET_PAGE_URL ?? ""),
      "import.meta.env.VITE_API_EMAIL_TEMPLATES_URL": JSON.stringify(env.VITE_API_EMAIL_TEMPLATES_URL ?? ""),
      "import.meta.env.VITE_API_EMAIL_URL": JSON.stringify(env.VITE_API_EMAIL_URL ?? ""),
      "import.meta.env.VITE_API_PINNED_ORDER_URL": JSON.stringify(env.VITE_API_PINNED_ORDER_URL ?? ""),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL ?? ""),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY ?? ""),
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
