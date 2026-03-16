import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";

const buildDate = process.env.BUILD_DATE ?? new Date().toISOString().slice(0, 10);

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  base: "/",
  css: {
    postcss: {
      plugins: [tailwind(), autoprefixer()],
    },
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_ID__: JSON.stringify("biz-calculator"),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    port: 6108,
  },
  esbuild:
    process.env.NODE_ENV === "production"
      ? { drop: ["console", "debugger"] }
      : {},
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name].[hash][extname]",
        chunkFileNames: "assets/[name].[hash].js",
        entryFileNames: "assets/[name].[hash].js",
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  ssgOptions: {
    includedRoutes() {
      return [
        "/",
        "/individual-vs-corp",
        "/break-even",
        "/vat-compare",
        "/delivery-fee",
        "/about",
        "/terms",
        "/privacy",
      ];
    },
  },
});
