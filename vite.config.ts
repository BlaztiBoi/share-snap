// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
export default defineConfig({
  // Cloudflare Workers build conflicts with Nitro/Vercel output — use Nitro for deploy.
  cloudflare: false,
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [
    nitro({
      preset: "vercel",
    }),
  ],
  vite: {
    define: {
      // Vercel sets VERCEL=1 at build time; cap client upload UI to match server limit.
      "import.meta.env.VITE_MAX_TOTAL_BYTES": JSON.stringify(
        process.env.VERCEL ? 4 * 1024 * 1024 : 100 * 1024 * 1024,
      ),
    },
  },
});
