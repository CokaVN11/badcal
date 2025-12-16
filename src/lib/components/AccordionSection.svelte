<script lang="ts">
	// ABOUTME: Collapsible section with completion state
	// ABOUTME: Auto-expands when previous section completes

	import { IconChevronDown, IconCheck } from '@tabler/icons-svelte-runes';
	import type { Snippet } from 'svelte';
	import { slide } from 'svelte/transition';

	type Props = {
		title: string;
		subtitle?: string;
		isComplete: boolean;
		isExpanded: boolean;
		completeBadge?: string; // e.g., "140k" when costs done
		onToggle: () => void;
		children: Snippet;
	};

	let { title, subtitle, isComplete, isExpanded, completeBadge, onToggle, children }: Props =
		$props();

	let contentId = $derived(`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`);
</script>

<div
	class="accordion-section bg-(--surface) border border-(--border) rounded-xl overflow-hidden transition-all duration-200"
	id={title}
	class:is-complete={isComplete}
	class:is-expanded={isExpanded}
	style={isComplete ? 'background: var(--zp-green-50)' : ''}
>
	<button
		class="w-full flex items-center gap-3 p-4 bg-transparent border-0 cursor-pointer text-left transition-colors duration-150 focus:outline-none hover:bg-(--surface-sunken)"
		type="button"
		onclick={onToggle}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onToggle())}
		aria-expanded={isExpanded}
		aria-controls={contentId}
	>
		<div class="shrink-0">
			{#if isComplete}
				<div
					class="size-6 rounded-full flex justify-center items-center text-white bg-(--zp-green-500)"
				>
					<IconCheck size={16} />
				</div>
			{:else}
				<div
					class="size-6 rounded-full flex justify-center items-center bg-(--slate-200) border-2 border-(--slate-300)"
				></div>
			{/if}
		</div>

		<div class="flex-1 min-w-0 text-left">
			<span class="font-bold text-(--ink)">{title}</span>
			{#if subtitle && !isComplete}
				<span class="block text-xs text-(--ink-muted) mt-0.5">{subtitle}</span>
			{/if}
			{#if isComplete && completeBadge}
				<span
					class="inline-flex items-center ml-2 py-1 px-2.5 bg-(--zp-green-100) text-(--zp-green-700) text-xs font-bold font-mono rounded-full"
				>
					{completeBadge}
				</span>
			{/if}
		</div>
		<IconChevronDown
			class="shrink-0 text-(--ink-muted) transition-transform duration-200 {isExpanded
				? 'rotate-180'
				: ''}"
			size={20}
		/>
	</button>
	{#if isExpanded}
		<div
			id={contentId}
			class="pt-0 px-4 pb-4 border-t border-(--border)"
			transition:slide={{ duration: 200 }}
		>
			{@render children()}
		</div>
	{/if}
</div>

<style>
	.accordion-section.is-expanded {
		box-shadow: var(--shadow-md);
	}
</style>
