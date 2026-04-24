<script lang="ts">
	import { page } from '$app/stores';
	import { setContext } from 'svelte';
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import LanguageToggle from '$lib/components/LanguageToggle.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';

	let { children } = $props();

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
		if (route === '/create') return !(ready && sessionStorage.courtBlocks.length > 0);
		if (route === '/details') return !(ready && sessionStorage.groups.some((g) => g.playerNames.length > 0));
		return !ready;
	});

	const sessionId = $derived(route.startsWith('/s/') ? route.split('/')[2] : undefined);

	const ctaHref = $derived.by(() => {
		if (route === '/create') return '/details';
		if (route === '/details') return undefined; // triggers form submit via button
		if (sessionId) return `/s/${sessionId}/share`;
		return undefined;
	});

	const showFooter = $derived(!route.endsWith('/share'));
</script>

<div class="min-h-dvh flex flex-col bg-surface-container-high">
	{@render children()}
</div>

{#if showFooter}
	<footer class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 backdrop-blur-md">
		<div class="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
			{#if ctaHref !== undefined}
				<Button
					href={ctaHref}
					variant="default"
					class="flex-1 h-12"
					disabled={ctaDisabled}
				>
					{ctaLabel}
				</Button>
			{:else}
				<Button
					type="submit"
					form="details-form"
					variant="default"
					class="flex-1 h-12"
					disabled={ctaDisabled}
				>
					{ctaLabel}
				</Button>
			{/if}
			<LanguageToggle />
		</div>
	</footer>
{/if}
