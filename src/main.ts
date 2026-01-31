import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

// Svelte 5 mounting: use mount() function
// Wait for DOM to be ready before mounting
function initApp() {
	mount(App, {
		target: document.body,
		props: {}
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initApp);
} else {
	initApp();
}