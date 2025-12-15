<script lang="ts">
	// ABOUTME: Bill Preview - shareable receipt-style view for social media/screenshot
	// ABOUTME: Clean, minimal design optimized for exporting and sharing

	import { m } from '$lib/paraglide/messages.js';
	import { formatCurrency, formatDate, getAvatarColor, getInitial } from '$lib/utils';
	import type { AdditionalCost, PlayerShare } from '$lib/types';
	import { tick } from 'svelte';
	import {
		IconPingPong,
		IconCalendar,
		IconUsers,
		IconClock,
		IconLoader2,
		IconShare
	} from '@tabler/icons-svelte-runes';
	import { toast } from 'svelte-sonner';

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
	let isCopyingText = $state(false);

	let totalHours = $derived.by(() => {
		return playerShares.reduce((sum, p) => sum + (p.hours || 0), 0);
	});

	const paidExtras = $derived.by(() => additionalCosts.filter((c) => c.amount > 0));
	const visibleExtraCount = 6;
	const visibleExtras = $derived.by(() => paidExtras.slice(0, visibleExtraCount));
	const remainingExtras = $derived.by(() => paidExtras.slice(visibleExtraCount));
	const remainingExtrasTotal = $derived.by(() =>
		remainingExtras.reduce((sum, c) => sum + (c.amount || 0), 0)
	);

	const isDensePlayers = $derived.by(() => playerShares.length > 10);
	const isUltraDensePlayers = $derived.by(() => playerShares.length > 16);

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

	async function copyShareText() {
		isCopyingText = true;
		try {
			await navigator.clipboard.writeText(generateShareText());
			toast.success(m.copied_to_clipboard());
		} catch {
			toast.error(m.copy_failed());
		} finally {
			isCopyingText = false;
		}
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
			const exportEl = receiptEl.cloneNode(true) as HTMLElement;
			exportEl.classList.remove('animate-pop-in');
			exportEl.style.width = '540px';
			exportEl.style.position = 'fixed';
			exportEl.style.left = '-10000px';
			exportEl.style.top = '0';
			exportEl.style.transform = 'none';
			exportEl.style.pointerEvents = 'none';
			document.body.append(exportEl);
			try {
				const blob = await toBlob(exportEl, {
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
				toast.success(m.image_downloaded());
			} finally {
				exportEl.remove();
			}
		} catch (e) {
			console.error('Failed to share image:', e);
			toast.error(m.share_image_failed());
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
		playerShares.forEach((p, i) => {
			const name = p.name?.trim() ? p.name : m.player_numbered({ n: i + 1 });
			text += `• ${name}: ${formatCurrency(p.share)}\n`;
		});

		return text;
	}
</script>

<div class="min-h-dvh bg-(--slate-100) flex flex-col">
	<!-- Header with back button -->
	<header
		class="bg-white/95 backdrop-blur-md border-b border-(--border) px-4 py-2 sticky top-0 z-30"
	>
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
			<h1 class="text-lg font-semibold text-(--ink) flex-1">
				{m.bill_preview_heading()}
			</h1>
			<button
				class="btn-icon"
				onclick={copyShareText}
				disabled={isCopyingText}
				aria-label={m.copy_text_btn()}
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M16 3H10a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V5a2 2 0 00-2-2z"
					/>
				</svg>
			</button>
		</div>
	</header>

	<!-- Receipt Card -->
	<main class="flex-1 p-3 pb-24">
		<div class="max-w-lg mx-auto">
			<div
				class="receipt-card animate-pop-in"
				style="animation-fill-mode: backwards;"
				bind:this={receiptEl}
			>
				<div class="receipt-topbar">
					<div class="receipt-topbar-inner">
						<div class="receipt-brand">
							<div class="receipt-brand-badge"><IconPingPong class="w-5 h-5" /></div>
							<div>{m.app_title()}</div>
						</div>
						<div class="flex items-center gap-2">
							<div class="receipt-chip">
								<IconCalendar class="w-3.5 h-3.5" />
								{formatDate(sessionDate)}
							</div>
							<div class="receipt-chip">
								<IconUsers class="w-3.5 h-3.5 inline" />
								{playerShares.length} • <IconClock class="w-3.5 h-3.5 inline" />
								{totalHours}{m.hours_unit()}
							</div>
						</div>
					</div>
				</div>

				<!-- Receipt Header -->
				<div class="receipt-header">
					<h2 class="text-lg font-bold text-(--slate-800)">
						{sessionTitle || m.app_title()}
					</h2>
				</div>

				<!-- Cost Breakdown -->
				<div class="px-4 py-3">
					<h3 class="text-xs font-semibold text-(--slate-400) uppercase tracking-wide mb-2">
						{m.breakdown()}
					</h3>

					<div class="space-y-1.5">
						{#if courtPrice > 0}
							<div class="flex justify-between items-center">
								<span class="text-[13px] text-(--slate-600)">{m.court_fee()}</span>
								<span class="font-mono text-[13px] text-(--slate-800)"
									>{formatCurrency(courtPrice)}</span
								>
							</div>
						{/if}

						{#if shuttlecockPrice > 0 && shuttlecockCount > 0}
							<div class="flex justify-between items-center">
								<span class="text-[13px] text-(--slate-600)">
									{m.shuttlecocks()} (×{shuttlecockCount})
								</span>
								<span class="font-mono text-[13px] text-(--slate-800)"
									>{formatCurrency(shuttlecockPrice * shuttlecockCount)}</span
								>
							</div>
						{/if}

						{#each visibleExtras as cost (cost.id)}
							<div class="flex justify-between items-center">
								<span class="text-[13px] text-(--slate-600)">{cost.label}</span>
								<span class="font-mono text-[13px] text-(--slate-800)"
									>{formatCurrency(cost.amount)}</span
								>
							</div>
						{/each}

						{#if remainingExtras.length > 0}
							<div class="flex justify-between items-center">
								<span class="text-[13px] text-(--slate-500)">
									{m.more_items({ count: remainingExtras.length })}
								</span>
								<span class="font-mono text-[13px] text-(--slate-700)"
									>{formatCurrency(remainingExtrasTotal)}</span
								>
							</div>
						{/if}
					</div>

					<!-- Total -->
					<div class="flex justify-between items-center mt-3 pt-3 border-t border-(--slate-200)">
						<span class="font-semibold text-(--ink)">{m.total_cost()}</span>
						<span class="font-mono text-lg font-bold text-(--zp-blue-600)"
							>{formatCurrency(totalCost)}</span
						>
					</div>
				</div>

				<!-- Dotted Separator -->
				<hr class="receipt-divider mx-4" />

				<!-- Player Shares -->
				<div class="px-4 pb-4">
					<h3 class="text-xs font-semibold text-(--slate-400) uppercase tracking-wide mb-2">
						{m.player_shares()}
					</h3>

					{#if isUltraDensePlayers}
						<div class="grid grid-cols-2 gap-x-3 gap-y-1.5">
							{#each playerShares as player, index (player.id)}
								<div class="flex items-center justify-between gap-2">
									<div class="text-[12px] text-(--ink-soft) truncate">
										{player.name?.trim() ? player.name : m.player_numbered({ n: index + 1 })}
									</div>
									<div class="font-mono text-[12px] font-bold text-(--zp-blue-600)">
										{formatCurrency(player.share)}
									</div>
								</div>
							{/each}
						</div>
					{:else if isDensePlayers}
						<div class="space-y-1.5">
							{#each playerShares as player, index (player.id)}
								<div class="flex items-center justify-between gap-2">
									<div class="text-[13px] font-medium text-(--ink) truncate">
										{player.name?.trim() ? player.name : m.player_numbered({ n: index + 1 })}
									</div>
									<div class="font-mono text-sm font-bold text-(--zp-blue-600)">
										{formatCurrency(player.share)}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="space-y-2">
							{#each playerShares as player, index (player.id)}
								<div class="flex items-center gap-2.5">
									<div class="player-avatar w-9 h-9 text-[12px] {getAvatarColor(index)}">
										{getInitial(
											player.name?.trim() ? player.name : m.player_numbered({ n: index + 1 })
										)}
									</div>
									<div class="flex-1 min-w-0">
										<div class="text-[13px] font-medium text-(--ink) truncate">
											{player.name?.trim() ? player.name : m.player_numbered({ n: index + 1 })}
										</div>
										<div class="text-xs text-(--ink-muted)">
											{player.hours}
											{m.hours_unit()} • {Math.round(player.ratio * 100)}%
										</div>
									</div>
									<div class="font-mono text-sm font-bold text-(--zp-blue-600)">
										{formatCurrency(player.share)}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Footer -->
				<div class="bg-(--surface-sunken) px-4 py-3 text-center border-t border-(--border)">
					<p class="text-xs text-(--ink-muted)">
						{m.generated_with()} • {m.app_title()}
					</p>
				</div>
			</div>
		</div>
	</main>

	<!-- Fixed Bottom Actions -->
	<footer
		class="fixed inset-x-0 bottom-0 p-3 bg-linear-to-t from-white via-white to-transparent z-20"
	>
		<div class="max-w-lg mx-auto flex gap-3">
			<button class="btn-secondary flex-1 h-12" onclick={onBack}>
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
				class="btn-primary flex-1 h-12"
				onclick={shareBillImage}
				disabled={isSharingImage || !receiptEl}
			>
				{#if isSharingImage}
					<IconLoader2 class="w-5 h-5 animate-spin" />
				{:else}
					<IconShare class="w-5 h-5" />
				{/if}
				{isSharingImage ? m.preparing_image() : m.share_image_btn()}
			</button>
		</div>
	</footer>
</div>
