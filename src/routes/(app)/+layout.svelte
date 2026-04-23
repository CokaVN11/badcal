<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { setContext } from 'svelte';
	import { sessionStore, hydrate, persist } from '$lib/stores/session.svelte';
	import LanguageToggle from '$lib/components/LanguageToggle.svelte';
	import * as m from '$lib/paraglide/messages';

	let { children } = $props();

	onMount(() => {
		hydrate();
		persist();
	});

	// ready signal set by child pages via context
	let ready = $state(false);

	function setReady(value: boolean) {
		ready = value;
	}

	// Provide layout context to child pages
	setContext('layout', { setReady });

	const route = $derived($page.url.pathname);

	// CTA label per route — reuse existing message keys
	const ctaLabel = $derived.by(() => {
		if (route === '/create') return m.onboarding_next();
		if (route === '/details') return m.onboarding_next();
		if (route.startsWith('/s/') && route.endsWith('/share')) return m.status_done();
		if (route.startsWith('/s/')) return m.share_btn();
		return m.onboarding_next();
	});

	const ctaDisabled = $derived.by(() => {
		if (route === '/create') return !(ready && sessionStore.courtBlocks.length > 0);
		if (route === '/details') return !(ready && sessionStore.groups.some((g) => g.playerNames.length > 0));
		return !ready;
	});

	const ctaHref = $derived.by(() => {
		if (route === '/create') return '/details';
		if (route === '/details') return undefined; // triggers form submit via button
		if (route.startsWith('/s/') && route.endsWith('/review')) {
			return `/s/${route.split('/')[2]}/share`;
		}
		if (route.startsWith('/s/') && !route.endsWith('/share')) {
			return `/s/${route.split('/')[2]}/share`;
		}
		return undefined;
	});

	const showFooter = $derived(!route.endsWith('/share'));
</script>

<div class="min-h-dvh flex flex-col bg-(--surface-muted)">
	{@render children()}
</div>

{#if showFooter}
	<footer class="fixed inset-x-0 bottom-0 z-40 border-t border-(--border) bg-white/95 backdrop-blur-md">
		<div class="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
			{#if ctaHref !== undefined}
				<a
					href={ctaHref}
					class="btn btn-primary flex-1 h-12"
					aria-disabled={ctaDisabled}
					class:opacity-50={ctaDisabled}
					class:cursor-not-allowed={ctaDisabled}
				>
					{ctaLabel}
				</a>
			{:else}
				<button
					type="submit"
					form="details-form"
					class="btn btn-primary flex-1 h-12"
					disabled={ctaDisabled}
					aria-disabled={ctaDisabled}
				>
					{ctaLabel}
				</button>
			{/if}
			<LanguageToggle />
		</div>
	</footer>
{/if}
