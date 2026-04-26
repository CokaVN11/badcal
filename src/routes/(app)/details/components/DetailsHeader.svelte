<script lang="ts">
	import { IconArrowLeft, IconDotsVertical } from '@tabler/icons-svelte-runes';
	import * as m from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';

	let {
		title = m.onboarding_step2_title()
	}: {
		title?: string;
	} = $props();

	function handleBack() {
		goto('/create');
	}
</script>

<header class="sticky top-0 z-50 bg-white border-b border-border shadow-xs flex items-center justify-between px-4 h-16 w-full">
	<div class="flex items-center gap-3">
		<button
			onclick={handleBack}
			class="flex items-center justify-center h-10 w-10 rounded-full hover:bg-neutral transition-all active:scale-95"
		>
			<IconArrowLeft class="h-5 w-5 text-primary" />
		</button>
		<h1 class="font-display! font-bold text-lg tracking-tight text-ink">
			{title}
		</h1>
	</div>
	<button class="flex items-center justify-center h-10 w-10 rounded-full hover:bg-neutral transition-all active:scale-95">
		<IconDotsVertical class="h-5 w-5 text-ink-soft" />
	</button>
</header>
