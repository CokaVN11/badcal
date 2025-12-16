<script lang="ts">
	// ABOUTME: Bottom sheet with share options and privacy controls
	// ABOUTME: Replaces direct share flow with more control

	import { m } from '$lib/paraglide/messages.js';
	import { fly, fade } from 'svelte/transition';
	import {
		IconX,
		IconShare,
		IconCopy,
		IconDownload,
		IconEye,
		IconEyeOff
	} from '@tabler/icons-svelte-runes';

	type Props = {
		isOpen: boolean;
		showNames: boolean;
		includeQR: boolean;
		onClose: () => void;
		onShareImage: () => void;
		onCopyText: () => void;
		onDownloadImage: () => void;
	};

	let {
		isOpen,
		showNames = $bindable(false),
		includeQR = $bindable(true),
		onClose,
		onShareImage,
		onCopyText,
		onDownloadImage
	}: Props = $props();
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-40 bg-black/50"
		transition:fade={{ duration: 150 }}
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="button"
		tabindex="-1"
	>
		<div
			class="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
			transition:fly={{ y: 300, duration: 250 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
			role="dialog"
			aria-modal="true"
			aria-labelledby="share-sheet-title"
			tabindex="-1"
		>
			<div class="flex justify-center pt-3 pb-1">
				<div class="w-10 h-1 bg-(--slate-300) rounded-full"></div>
			</div>

			<div class="flex items-center justify-between px-4 pb-3 border-b border-(--border)">
				<h2 id="share-sheet-title" class="text-lg font-bold text-(--ink)">
					{m.share_sheet_title()}
				</h2>
				<button
					class="p-2 text-(--ink-muted) hover:text-(--ink) hover:bg-(--slate-100) rounded-full transition-colors"
					onclick={onClose}
					aria-label={m.close()}
				>
					<IconX size={20} />
				</button>
			</div>

			<div class="p-4 space-y-3">
				<label
					class="flex items-center gap-3 p-3 bg-(--slate-50) rounded-xl cursor-pointer hover:bg-(--slate-100) transition-colors"
				>
					<input type="checkbox" bind:checked={showNames} class="sr-only peer" />
					<span
						class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-(--slate-200) peer-checked:bg-(--zp-blue-100) text-(--ink-muted) peer-checked:text-(--zp-blue-600) transition-colors"
					>
						{#if showNames}<IconEye size={18} />{:else}<IconEyeOff size={18} />{/if}
					</span>
					<span class="flex-1 min-w-0">
						<span class="block text-sm font-semibold text-(--ink)">{m.share_show_names()}</span>
						<span class="block text-xs text-(--ink-muted)">{m.share_show_names_hint()}</span>
					</span>
					<span
						class="shrink-0 w-10 h-6 rounded-full bg-(--slate-300) peer-checked:bg-(--zp-blue-500) relative transition-colors"
					>
						<span
							class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform {showNames
								? 'translate-x-4'
								: ''}"
						></span>
					</span>
				</label>

				<label
					class="flex items-center gap-3 p-3 bg-(--slate-50) rounded-xl cursor-pointer hover:bg-(--slate-100) transition-colors"
				>
					<input type="checkbox" bind:checked={includeQR} class="sr-only peer" />
					<span
						class="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-(--slate-200) peer-checked:bg-(--zp-blue-100) text-lg"
					>
						📱
					</span>
					<span class="flex-1 min-w-0">
						<span class="block text-sm font-semibold text-(--ink)">{m.share_include_qr()}</span>
						<span class="block text-xs text-(--ink-muted)">{m.share_include_qr_hint()}</span>
					</span>
					<span
						class="shrink-0 w-10 h-6 rounded-full bg-(--slate-300) peer-checked:bg-(--zp-blue-500) relative transition-colors"
					>
						<span
							class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform {includeQR
								? 'translate-x-4'
								: ''}"
						></span>
					</span>
				</label>
			</div>

			<div class="p-4 pt-0 space-y-3 pb-8">
				<button
					class="w-full flex items-center justify-center gap-2 py-3.5 bg-(--zp-blue-500) hover:bg-(--zp-blue-600) text-white font-semibold rounded-xl transition-colors"
					onclick={onShareImage}
				>
					<IconShare size={20} />
					<span>{m.share_image_btn()}</span>
				</button>

				<div class="grid grid-cols-2 gap-3">
					<button
						class="flex items-center justify-center gap-2 py-3 bg-(--slate-100) hover:bg-(--slate-200) text-(--ink) font-medium rounded-xl transition-colors"
						onclick={onCopyText}
					>
						<IconCopy size={18} />
						<span>{m.copy_text_btn()}</span>
					</button>
					<button
						class="flex items-center justify-center gap-2 py-3 bg-(--slate-100) hover:bg-(--slate-200) text-(--ink) font-medium rounded-xl transition-colors"
						onclick={onDownloadImage}
					>
						<IconDownload size={18} />
						<span>{m.share_download()}</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
