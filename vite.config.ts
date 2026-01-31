import devtoolsJson from 'vite-plugin-devtools-json';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig(({ command }) => ({
	plugins: [
		tailwindcss(),
		svelte(),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' }),
		devtoolsJson()
	],
	server: {
		fs: {
			// Allow serving files from one level up to the project root
			allow: ['..']
		}
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib')
		}
	},
	build: {
		sourcemap: command === 'serve',
		outDir: 'dist'
	},
	optimizeDeps: {
		exclude: ['svelte']
	}
}));
