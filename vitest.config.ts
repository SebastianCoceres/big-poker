import { defineConfig } from "vitest/config";

// Separate from vite.config.ts on purpose — the app's SSR/nitro/tanstackStart
// plugins have no place in a test environment and would only slow it down
// or conflict with Vitest's own transform pipeline.
export default defineConfig({
	resolve: { tsconfigPaths: true },
	test: {
		environment: "happy-dom",
	},
});
