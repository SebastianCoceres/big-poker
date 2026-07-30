import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import basicSsl from "@vitejs/plugin-basic-ssl";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	server: { host: true },
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart(),
		nitro(),
		viteReact(),
		// Self-signed HTTPS for the dev server only (basicSsl no-ops on
		// `vite build`) — the camera QR scanner needs a secure context, and a
		// plain http:// LAN IP doesn't count as one (only localhost does).
		basicSsl(),
	],
});

export default config;
