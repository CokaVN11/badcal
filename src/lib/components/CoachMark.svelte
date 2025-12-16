<script lang="ts">
	// ABOUTME: Tooltip-style coach mark for first-time user guidance
	// ABOUTME: Highlights target element with spotlight effect

	import { m } from '$lib/paraglide/messages.js';
	import { fade, fly } from 'svelte/transition';
	import { IconX } from '@tabler/icons-svelte-runes';

	type Props = {
		title: string;
		description: string;
		step: number;
		totalSteps: number;
		targetSelector: string;
		position: 'top' | 'bottom' | 'left' | 'right';
		onNext: () => void;
		onSkip: () => void;
	};

	let { title, description, step, totalSteps, targetSelector, position, onNext, onSkip }: Props =
		$props();

	let targetRect = $state<DOMRect | null>(null);

	$effect(() => {
		const target = document.querySelector(targetSelector);
		if (target) {
			targetRect = target.getBoundingClientRect();
			// Update on scroll/resize
			const updateRect = () => {
				targetRect = target.getBoundingClientRect();
			};
			window.addEventListener('scroll', updateRect, true);
			window.addEventListener('resize', updateRect);
			return () => {
				window.removeEventListener('scroll', updateRect, true);
				window.removeEventListener('resize', updateRect);
			};
		}
	});

	let tooltipStyle = $derived.by(() => {
		if (!targetRect) return '';
		const gap = 16;
		let top = 0;
		let left = targetRect.left;
		let transform = '';

		switch (position) {
			case 'bottom':
				top = targetRect.bottom + gap;
				break;
			case 'top':
				top = targetRect.top - gap;
				transform = 'translateY(-100%)';
				break;
			case 'left':
				top = targetRect.top + targetRect.height / 2;
				left = targetRect.left - gap;
				transform = 'translate(-100%, -50%)';
				break;
			case 'right':
				top = targetRect.top + targetRect.height / 2;
				left = targetRect.right + gap;
				transform = 'translateY(-50%)';
				break;
		}

		return `top: ${top}px; left: ${left}px; transform: ${transform};`;
	});
</script>

{#if targetRect}
	<div class="fixed inset-0 z-50" transition:fade={{ duration: 200 }}>
		<div class="absolute inset-0 bg-black/60"></div>
		<div
			class="absolute rounded-xl ring-4 ring-white/80"
			style="
				top: {targetRect.top - 8}px;
				left: {targetRect.left - 8}px;
				width: {targetRect.width + 16}px;
				height: {targetRect.height + 16}px;
				box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
			"
		></div>
	</div>

	<div
		class="fixed z-50 w-72 p-4 bg-white rounded-xl shadow-xl border border-(--border)"
		style={tooltipStyle}
		transition:fly={{ y: 10, duration: 200 }}
	>
		<button
			class="absolute top-2 right-2 p-1 text-(--ink-muted) hover:text-(--ink) rounded-full hover:bg-(--slate-100) transition-colors"
			onclick={onSkip}
			aria-label={m.onboarding_skip_tour()}
		>
			<IconX size={16} />
		</button>

		<div class="text-xs font-medium text-(--ink-muted) mb-1">{step} / {totalSteps}</div>
		<h3 class="text-base font-bold text-(--ink) mb-1">{title}</h3>
		<p class="text-sm text-(--ink-soft) mb-4">{description}</p>

		<div class="flex justify-between items-center gap-2">
			<button
				class="px-3 py-1.5 text-sm text-(--ink-muted) hover:text-(--ink) transition-colors"
				onclick={onSkip}
			>
				{m.onboarding_skip()}
			</button>
			<button
				class="px-4 py-2 text-sm font-semibold text-white bg-(--zp-blue-500) hover:bg-(--zp-blue-600) rounded-lg transition-colors"
				onclick={onNext}
			>
				{step === totalSteps ? m.onboarding_got_it() : m.onboarding_next()}
			</button>
		</div>
	</div>
{/if}
