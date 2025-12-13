<script lang="ts">
	// ABOUTME: Bill Preview - shareable receipt-style view for social media/screenshot
	// ABOUTME: Clean, minimal design optimized for exporting and sharing

	import { m } from '$lib/paraglide/messages.js';
	import { formatCurrency, formatDate, getAvatarColor, getInitial } from '$lib/utils';
	import type { AdditionalCost, PlayerShare } from '$lib/types';
	import { tick } from 'svelte';

	let {
		sessionTitle,
		sessionDate,
		courtPrice,
		shuttlecockPrice,
		shuttlecockCount,
		additionalCosts,
		playerShares,
		totalCost,
		onBack
	}: {
		sessionTitle: string;
		sessionDate: string;
		courtPrice: number;
		shuttlecockPrice: number;
		shuttlecockCount: number;
		additionalCosts: AdditionalCost[];
		playerShares: PlayerShare[];
		totalCost: number;
		onBack: () => void;
	} = $props();

	let receiptEl: HTMLDivElement | null = $state(null);
	let isSharingImage = $state(false);

	function downloadBlob(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function buildImageFilename() {
		const safeTitle = (sessionTitle || m.app_title())
			.trim()
			.replace(/\s+/g, '-')
			.replace(/[^\p{L}\p{N}-]/gu, '')
			.slice(0, 48);

		const safeDate = sessionDate?.trim() || new Date().toISOString().split('T')[0];
		return `badcal-${safeDate}${safeTitle ? `-${safeTitle}` : ''}.png`;
	}

	async function shareBillImage() {
		if (!receiptEl) return;

		isSharingImage = true;
		try {
			await tick();
			// Ensure web fonts are ready before rendering to image.
			if ('fonts' in document) {
				try {
					await document.fonts.ready;
				} catch {
					// ignore
				}
			}

			const { toBlob } = await import('html-to-image');
			const blob = await toBlob(receiptEl, {
				cacheBust: true,
				pixelRatio: 2,
				backgroundColor: '#ffffff'
			});
			if (!blob) throw new Error('Failed to generate image blob');

			const filename = buildImageFilename();
			const file = new File([blob], filename, { type: blob.type || 'image/png' });

			if (navigator.share) {
				try {
					const shareData: ShareData = {
						title: sessionTitle || m.app_title(),
						text: generateShareText(),
						files: [file]
					};

					if (!navigator.canShare || navigator.canShare(shareData)) {
						await navigator.share(shareData);
						return;
					}
				} catch {
					// User cancelled or share failed, fall through to download
				}
			}

			downloadBlob(blob, filename);
			alert(m.image_downloaded());
		} catch (e) {
			console.error('Failed to share image:', e);
			alert(m.share_image_failed());
		} finally {
			isSharingImage = false;
		}
	}

	function generateShareText() {
		let text = `🏸 ${sessionTitle || m.app_title()}\n`;
		text += `📅 ${formatDate(sessionDate)}\n\n`;
		text += `💰 ${m.total_cost()}: ${formatCurrency(totalCost)}\n\n`;
		text += `${m.breakdown()}:\n`;

		if (courtPrice > 0) {
			text += `• ${m.court_fee()}: ${formatCurrency(courtPrice)}\n`;
		}
		if (shuttlecockPrice > 0 && shuttlecockCount > 0) {
			text += `• ${m.shuttlecocks()}: ${formatCurrency(shuttlecockPrice * shuttlecockCount)}\n`;
		}
		additionalCosts.forEach((c) => {
			if (c.amount > 0) {
				text += `• ${c.label}: ${formatCurrency(c.amount)}\n`;
			}
		});

		text += `\n${m.player_shares()}:\n`;
		playerShares.forEach((p) => {
			text += `• ${p.name || m.unnamed_player()}: ${formatCurrency(p.share)}\n`;
		});

		return text;
	}
</script>

<div class="min-h-dvh bg-(--slate-100) flex flex-col">
	<!-- Header with back button -->
	<header class="bg-white border-b border-(--slate-200) px-4 py-3 sticky top-0 z-30">
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<button class="btn-icon" onclick={onBack} aria-label={m.edit()}>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
			</button>
			<h1 class="text-lg font-semibold text-(--slate-800) flex-1">
				{m.bill_preview_heading()}
			</h1>
		</div>
	</header>

	<!-- Receipt Card -->
	<main class="flex-1 p-4 pb-28">
		<div class="max-w-lg mx-auto">
			<div
				class="receipt-card animate-pop-in"
				style="animation-fill-mode: backwards;"
				bind:this={receiptEl}
			>
				<!-- Receipt Header -->
				<div class="receipt-header">
					<div class="receipt-logo">🏸</div>
					<h2 class="text-xl font-bold text-(--slate-800)">
						{sessionTitle || m.app_title()}
					</h2>
					<p class="text-sm text-(--slate-500) mt-1">
						{formatDate(sessionDate)}
					</p>
				</div>

				<!-- Cost Breakdown -->
				<div class="px-5 py-4">
					<h3 class="text-xs font-semibold text-(--slate-400) uppercase tracking-wide mb-3">
						{m.breakdown()}
					</h3>

					<div class="space-y-2">
						{#if courtPrice > 0}
							<div class="flex justify-between items-center">
								<span class="text-sm text-(--slate-600)">{m.court_fee()}</span>
								<span class="font-mono text-sm text-(--slate-800)"
									>{formatCurrency(courtPrice)}</span
								>
							</div>
						{/if}

						{#if shuttlecockPrice > 0 && shuttlecockCount > 0}
							<div class="flex justify-between items-center">
								<span class="text-sm text-(--slate-600)">
									{m.shuttlecocks()} (×{shuttlecockCount})
								</span>
								<span class="font-mono text-sm text-(--slate-800)"
									>{formatCurrency(shuttlecockPrice * shuttlecockCount)}</span
								>
							</div>
						{/if}

						{#each additionalCosts as cost (cost.id)}
							{#if cost.amount > 0}
								<div class="flex justify-between items-center">
									<span class="text-sm text-(--slate-600)">{cost.label}</span>
									<span class="font-mono text-sm text-(--slate-800)"
										>{formatCurrency(cost.amount)}</span
									>
								</div>
							{/if}
						{/each}
					</div>

					<!-- Total -->
					<div class="flex justify-between items-center mt-4 pt-4 border-t border-(--slate-200)">
						<span class="font-semibold text-(--slate-800)">{m.total_cost()}</span>
						<span class="font-mono text-xl font-bold text-(--court-600)"
							>{formatCurrency(totalCost)}</span
						>
					</div>
				</div>

				<!-- Dotted Separator -->
				<hr class="receipt-divider mx-5" />

				<!-- Player Shares -->
				<div class="px-5 pb-5">
					<h3 class="text-xs font-semibold text-(--slate-400) uppercase tracking-wide mb-3">
						{m.player_shares()}
					</h3>

					<div class="space-y-3">
						{#each playerShares as player, index (player.id)}
							<div class="flex items-center gap-3">
								<div class="player-avatar w-10 h-10 {getAvatarColor(index)}">
									{getInitial(player.name)}
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-(--slate-800) truncate">
										{player.name || m.unnamed_player()}
									</div>
									<div class="text-xs text-(--slate-400)">
										{player.hours}
										{m.hours_unit()} • {Math.round(player.ratio * 100)}%
									</div>
								</div>
								<div class="font-mono text-base font-bold text-(--court-600)">
									{formatCurrency(player.share)}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Footer -->
				<div class="bg-(--slate-50) px-5 py-3 text-center border-t border-(--slate-200)">
					<p class="text-xs text-(--slate-400)">
						{m.generated_with()} • {m.app_title()}
					</p>
				</div>
			</div>
		</div>
	</main>

	<!-- Fixed Bottom Actions -->
	<footer
		class="fixed inset-x-0 bottom-0 p-4 bg-linear-to-t from-white via-white to-transparent z-20"
	>
		<div class="max-w-lg mx-auto flex gap-3">
			<button class="btn-secondary flex-1 h-14" onclick={onBack}>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				</svg>
				{m.edit()}
			</button>
			<button
				class="btn-primary flex-1 h-14"
				onclick={shareBillImage}
				disabled={isSharingImage || !receiptEl}
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
					/>
				</svg>
				{isSharingImage ? m.preparing_image() : m.share_image_btn()}
			</button>
		</div>
	</footer>
</div>
