/**
 * Client-side environment constants
 * Replaces SvelteKit's $app/environment module
 */

export const browser = typeof window !== 'undefined';
export const dev = import.meta.env.DEV;
export const mode = import.meta.env.MODE;
