import devtoolsJson from 'vite-plugin-devtools-json';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(({ command }) => ({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' }),
		devtoolsJson()
	],
	server: {
		fs: {
			// Allow serving files from one level up to the project root
			allow: ['..']
		}
	},
	ssr: {
		external: ['reflect-metadata']
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib')
		}
	},
	build: {
		sourcemap: command === 'serve'
	},
	optimizeDeps: {
		exclude: ['svelte']
	}
}));
