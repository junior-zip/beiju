import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { resolve } from 'path'

export default defineConfig({
  cacheDir: "./node_modules/.vitest",
  plugins: [tsconfigPaths()],
  test: {
    include: ["src/test/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    environment: "node",
    isolate: true,
  },
  resolve: {
    alias: {
      "@core": resolve(__dirname, "./src/core"),
      "@builders": resolve(__dirname, "./src/builders"),
      "@semantic": resolve(__dirname, "./src/semantic"),
      "@infrastructure": resolve(__dirname, "./src/infrastructure"),
      "@codegen": resolve(__dirname, "./src/codegen"),
    },
  },
});