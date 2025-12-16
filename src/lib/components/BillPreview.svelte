<script lang="ts">
	// ABOUTME: Bill Preview - dual theme receipt for social media/screenshot
	// ABOUTME: Supports thermal paper and modern ZaloPay fintech styles

	const PLAYER_COLORS = [
		'#0033c9',
		'#00cf6a',
		'#6e0cdf',
		'#ff8a00',
		'#00b4ff',
		'#14b8a6',
		'#f43f5e',
		'#8b5cf6'
	];

	function getPlayerColor(index: number): string {
		return PLAYER_COLORS[index % PLAYER_COLORS.length];
	}

	import { m } from '$lib/paraglide/messages.js';
	import {
		formatCurrency,
		formatDate,
		groupByKey,
		getNamedPlayers,
		getOthersCount,
		triggerHaptic
	} from '$lib/utils';
	import type { AdditionalCost, PlayerShare } from '$lib/types';
	import { tick, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';
	import {
		IconLoader2,
		IconShare,
		IconCopy,
		IconChevronLeft,
		IconPencil,
		IconReceipt,
		IconCreditCard,
		IconUsers,
		IconClock,
		IconCheck
	} from '@tabler/icons-svelte-runes';
	import { toast } from 'svelte-sonner';
	import PaymentQR from './PaymentQR.svelte';
	import ShareSheet from './ShareSheet.svelte';
	import { loadPaymentInfo, getProviderDisplayName } from '$lib/utils/vietqr';

	type BillTheme = 'thermal' | 'zalopay';

	type Props = {
		sessionTitle: string;
		sessionDate: string;
		courtPrice: number;
		shuttlecockPrice: number;
		shuttlecockCount: number;
		additionalCosts: AdditionalCost[];
		playerShares: PlayerShare[];
		totalCost: number;
		onBack: () => void;
	};

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
	}: Props = $props();

	let receiptEl: HTMLDivElement | null = $state(null);
	let isSharingImage = $state(false);
	let isCopyingText = $state(false);

	let isShareSheetOpen = $state(false);
	let showNames = $state(false);
	let includeQR = $state(true);
	let showCelebration = $state(false);

	// Theme state - default to zalopay for the modern look
	const THEME_STORAGE_KEY = 'badcal-bill-theme';
	let currentTheme: BillTheme = $state('zalopay');

	// Load theme preference from localStorage on mount
	onMount(() => {
		const saved = localStorage.getItem(THEME_STORAGE_KEY);
		if (saved === 'thermal' || saved === 'zalopay') {
			currentTheme = saved;
		}
	});

	function toggleTheme() {
		currentTheme = currentTheme === 'thermal' ? 'zalopay' : 'thermal';
		if (browser) {
			localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
		}
		triggerHaptic('light');
	}

	function triggerCelebration() {
		showCelebration = true;
		triggerHaptic('medium');
		setTimeout(() => {
			showCelebration = false;
		}, 1500);
	}

	const MAX_VISIBLE_EXTRAS = 6;

	let totalHours = $derived(playerShares.reduce((sum, p) => sum + (p.hours || 0), 0));
	let paidExtras = $derived(additionalCosts.filter((c) => c.amount > 0));
	let visibleExtras = $derived(paidExtras.slice(0, MAX_VISIBLE_EXTRAS));
	let remainingExtras = $derived(paidExtras.slice(MAX_VISIBLE_EXTRAS));
	let remainingExtrasTotal = $derived(remainingExtras.reduce((sum, c) => sum + c.amount, 0));
	let groupedByHours = $derived(groupByKey(playerShares, (p) => p.hours));
	let shuttlecockTotal = $derived(shuttlecockPrice * shuttlecockCount);

	function buildImageFilename(): string {
		const safeTitle = (sessionTitle || m.app_title())
			.trim()
			.replace(/\s+/g, '-')
			.replace(/[^\p{L}\p{N}-]/gu, '')
			.slice(0, 48);
		const safeDate = sessionDate?.trim() || new Date().toISOString().split('T')[0];
		return `badcal-${safeDate}${safeTitle ? `-${safeTitle}` : ''}.png`;
	}

	function generateShareText(): string {
		const lines: string[] = [
			`🏸 ${sessionTitle || m.app_title()}`,
			`📅 ${formatDate(sessionDate)}`,
			'',
			`💰 ${m.total_cost()}: ${formatCurrency(totalCost)}`,
			'',
			`${m.breakdown()}:`
		];

		if (courtPrice > 0) lines.push(`• ${m.court_fee()}: ${formatCurrency(courtPrice)}`);
		if (shuttlecockTotal > 0)
			lines.push(`• ${m.shuttlecocks()}: ${formatCurrency(shuttlecockTotal)}`);
		additionalCosts
			.filter((c) => c.amount > 0)
			.forEach((c) => lines.push(`• ${c.label}: ${formatCurrency(c.amount)}`));

		lines.push('', `${m.player_shares()}:`);

		if (showNames) {
			playerShares.forEach((p, i) => {
				const name = p.name?.trim() || m.player_numbered({ n: i + 1 });
				lines.push(`• ${name}: ${formatCurrency(p.share)}`);
			});
		} else {
			for (const [hours, players] of groupedByHours) {
				const groupShare = players[0]?.share ?? 0;
				lines.push(
					`• [${hours}${m.hours_unit()}] ${players.length}x: ${formatCurrency(groupShare)} ${m.each_suffix()}`
				);
			}
		}

		if (includeQR) {
			const paymentInfo = loadPaymentInfo();
			if (paymentInfo) {
				const bankName = getProviderDisplayName(paymentInfo.providerKey);
				lines.push('', `🏦 ${m.qr_bank_label()}: ${bankName}`);
				lines.push(`📝 ${paymentInfo.accountNumber}`);
				if (paymentInfo.accountName) {
					lines.push(`👤 ${paymentInfo.accountName}`);
				}
			}
		}

		return lines.join('\n');
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

	async function waitForFonts() {
		if ('fonts' in document) {
			try {
				await document.fonts.ready;
			} catch {
				/* ignore */
			}
		}
	}

	async function generateImageBlob(element: HTMLElement): Promise<Blob> {
		const { toPng } = await import('html-to-image');

		const hadAnimation = element.classList.contains('animate-pop-in');
		if (hadAnimation) element.classList.remove('animate-pop-in');

		const bgColor = currentTheme === 'zalopay' ? '#f1f5f9' : 'transparent';

		try {
			const dataUrl = await toPng(element, {
				cacheBust: true,
				pixelRatio: 2,
				backgroundColor: bgColor,
				skipFonts: false,
				includeQueryParams: true,
				filter: (node) => {
					if (node instanceof Element) {
						const tagName = node.tagName?.toLowerCase();
						if (tagName === 'script' || tagName === 'noscript') return false;
					}
					return true;
				}
			});

			const res = await fetch(dataUrl);
			const blob = await res.blob();
			if (!blob || blob.size === 0) throw new Error('Failed to generate image');
			return blob;
		} finally {
			if (hadAnimation) element.classList.add('animate-pop-in');
		}
	}

	async function tryNativeShare(file: File): Promise<boolean> {
		if (!navigator.share) return false;
		const shareData: ShareData = {
			title: sessionTitle || m.app_title(),
			text: generateShareText(),
			files: [file]
		};
		if (navigator.canShare && !navigator.canShare(shareData)) return false;
		try {
			await navigator.share(shareData);
			return true;
		} catch {
			return false;
		}
	}

	function downloadBlob(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function shareBillImage() {
		if (!receiptEl) {
			console.error('Receipt element not found');
			return;
		}
		isSharingImage = true;

		try {
			await tick();
			await waitForFonts();

			const blob = await generateImageBlob(receiptEl);
			const filename = buildImageFilename();
			const file = new File([blob], filename, { type: 'image/png' });

			const shared = await tryNativeShare(file);
			if (shared) {
				triggerCelebration();
			} else {
				downloadBlob(blob, filename);
				toast.success(m.image_downloaded());
				triggerCelebration();
			}
		} catch (e) {
			console.error('Failed to share image:', e);
			if (e instanceof Error) {
				console.error('Error details:', e.message, e.stack);
			}
			toast.error(m.share_image_failed());
		} finally {
			isSharingImage = false;
		}
	}

	async function downloadBillImage() {
		if (!receiptEl) return;
		isSharingImage = true;

		try {
			await tick();
			await waitForFonts();

			const blob = await generateImageBlob(receiptEl);
			const filename = buildImageFilename();
			downloadBlob(blob, filename);
			toast.success(m.image_downloaded());
		} catch (e) {
			console.error('Failed to download image:', e);
			toast.error(m.share_image_failed());
		} finally {
			isSharingImage = false;
		}
	}

	function openShareSheet() {
		isShareSheetOpen = true;
	}

	function closeShareSheet() {
		isShareSheetOpen = false;
	}

	function handleShareImage() {
		closeShareSheet();
		tick().then(() => shareBillImage());
	}

	function handleCopyText() {
		closeShareSheet();
		copyShareText();
	}

	function handleDownloadImage() {
		closeShareSheet();
		tick().then(() => downloadBillImage());
	}
</script>

<div
	class="min-h-dvh flex flex-col {currentTheme === 'zalopay' ? 'bg-(--slate-100)' : 'bg-stone-200'}"
>
	<header
		class="backdrop-blur-md border-b px-4 py-2 sticky top-0 z-30 {currentTheme === 'zalopay'
			? 'bg-white/95 border-(--border)'
			: 'bg-white/95 border-stone-300'}"
	>
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<button class="btn-icon" onclick={onBack} aria-label={m.edit()}>
				<IconChevronLeft class="w-5 h-5" />
			</button>
			<h1
				class="text-lg font-semibold flex-1 {currentTheme === 'zalopay'
					? 'text-(--ink)'
					: 'text-stone-800'}"
			>
				{m.bill_preview_heading()}
			</h1>

			<button
				class="p-2 rounded-lg transition-colors {currentTheme === 'zalopay'
					? 'bg-(--zp-blue-50) text-(--zp-blue-600) hover:bg-(--zp-blue-100)'
					: 'bg-stone-100 text-stone-600 hover:bg-stone-200'}"
				onclick={toggleTheme}
				aria-label="Toggle theme"
				title={currentTheme === 'zalopay' ? m.theme_switch_thermal() : m.theme_switch_zalopay()}
			>
				{#if currentTheme === 'zalopay'}
					<IconReceipt class="w-5 h-5" />
				{:else}
					<IconCreditCard class="w-5 h-5" />
				{/if}
			</button>

			<button
				class="btn-icon"
				onclick={copyShareText}
				disabled={isCopyingText}
				aria-label={m.copy_text_btn()}
			>
				<IconCopy class="w-5 h-5" />
			</button>
		</div>
	</header>

	<main class="flex-1 p-4 pb-28">
		<div class="max-w-md mx-auto">
			{#if currentTheme === 'zalopay'}
				<!-- ZaloPay Modern Theme -->
				<div class="zp-receipt animate-pop-in" bind:this={receiptEl}>
					<div class="zp-header">
						<div class="zp-header-left">
							<span class="zp-logo">🏸</span>
							<span class="zp-brand">{m.app_title()}</span>
						</div>
						<div class="zp-status"><IconCheck class="w-3 h-3" />{m.status_done()}</div>
					</div>

					<div class="zp-hero">
						<div class="zp-hero-top">
							<span class="zp-session">{sessionTitle || m.session_fallback()}</span>
							<span class="zp-date">{formatDate(sessionDate)}</span>
						</div>
						<div class="zp-total">{formatCurrency(totalCost)}</div>
						<div class="zp-stats">
							<span>{playerShares.length} {m.players_count()}</span>
							<span class="zp-dot">•</span>
							<span>{totalHours}h</span>
						</div>
					</div>

					<div class="zp-section">
						<div class="zp-section-head">{m.breakdown()}</div>
						{#if courtPrice > 0}
							<div class="zp-row">
								<span>{m.court_fee()}</span>
								<span class="zp-val">{formatCurrency(courtPrice)}</span>
							</div>
						{/if}
						{#if shuttlecockTotal > 0}
							<div class="zp-row">
								<span>{m.shuttlecocks()} ×{shuttlecockCount}</span>
								<span class="zp-val">{formatCurrency(shuttlecockTotal)}</span>
							</div>
						{/if}
						{#each visibleExtras as cost (cost.id)}
							<div class="zp-row">
								<span>{cost.label}</span>
								<span class="zp-val">{formatCurrency(cost.amount)}</span>
							</div>
						{/each}
						{#if remainingExtras.length > 0}
							<div class="zp-row zp-muted">
								<span>{m.more_items({ count: remainingExtras.length })}</span>
								<span class="zp-val">{formatCurrency(remainingExtrasTotal)}</span>
							</div>
						{/if}
					</div>

					<div class="zp-section">
						<div class="zp-section-head">{m.player_shares()}</div>
						{#if showNames}
							{#each playerShares as player, i (player.id)}
								<div class="zp-player">
									<span class="zp-avatar" style="background:{getPlayerColor(i)}"
										>{(player.name?.trim() || `P${i + 1}`).charAt(0).toUpperCase()}</span
									>
									<span class="zp-name"
										>{player.name?.trim() || m.player_numbered({ n: i + 1 })}</span
									>
									<span class="zp-hrs">{player.hours}h</span>
									<span class="zp-share">{formatCurrency(player.share)}</span>
								</div>
							{/each}
						{:else}
							{#each groupedByHours as [hours, players] (hours)}
								{@const groupShare = players[0]?.share ?? 0}
								{@const namedPlayers = getNamedPlayers(players)}
								{@const othersCount = getOthersCount(namedPlayers.length, players.length)}
								<div class="zp-group">
									<span class="zp-badge">{hours}h</span>
									<div>
										<span class="zp-gcount">{players.length}×</span>
										{#if namedPlayers.length > 0}
											<span class="zp-gnames"
												>{namedPlayers[0]}{#if othersCount > 0}+{othersCount}{/if}</span
											>
										{/if}
										<span class="zp-gshare"
											>{formatCurrency(groupShare)}<small>{m.each_suffix()}</small></span
										>
									</div>
								</div>
							{/each}
						{/if}
					</div>

					{#if includeQR}
						<div class="zp-qr">
							<PaymentQR />
						</div>
					{/if}

					<div class="zp-foot">
						<span>🏸 {m.generated_with()}</span>
						<span>{new Date().toLocaleDateString()}</span>
					</div>
				</div>
			{:else}
				<!-- Thermal Receipt Theme (Original) -->
				<div class="thermal-receipt animate-pop-in" bind:this={receiptEl}>
					<div class="torn-edge torn-top"></div>

					<div class="thermal-paper">
						<div class="scratches"></div>

						<div class="receipt-store">
							<div class="store-logo">🏸</div>
							<div class="store-name">{m.app_title()}</div>
							<div class="store-tagline">{m.app_tagline()}</div>
						</div>

						<div class="receipt-line-double"></div>

						<div class="receipt-section">
							<div class="receipt-title">{sessionTitle || m.session_fallback()}</div>
							<div class="receipt-meta">
								<span>{formatDate(sessionDate)}</span>
								<span>{m.thermal_stats({ count: playerShares.length, hours: totalHours })}</span>
							</div>
						</div>

						<div class="receipt-line-dashed"></div>

						<div class="receipt-section">
							<div class="receipt-heading">{m.breakdown().toUpperCase()}</div>

							<div class="receipt-items">
								{#if courtPrice > 0}
									<div class="receipt-item">
										<span>{m.court_fee()}</span>
										<span class="dots"></span>
										<span>{formatCurrency(courtPrice)}</span>
									</div>
								{/if}
								{#if shuttlecockTotal > 0}
									<div class="receipt-item">
										<span>{m.shuttlecocks()} x{shuttlecockCount}</span>
										<span class="dots"></span>
										<span>{formatCurrency(shuttlecockTotal)}</span>
									</div>
								{/if}
								{#each visibleExtras as cost (cost.id)}
									<div class="receipt-item">
										<span>{cost.label}</span>
										<span class="dots"></span>
										<span>{formatCurrency(cost.amount)}</span>
									</div>
								{/each}
								{#if remainingExtras.length > 0}
									<div class="receipt-item muted">
										<span>{m.more_items({ count: remainingExtras.length })}</span>
										<span class="dots"></span>
										<span>{formatCurrency(remainingExtrasTotal)}</span>
									</div>
								{/if}
							</div>
						</div>

						<div class="receipt-line-dashed"></div>

						<div class="receipt-total">
							<span>{m.total_cost().toUpperCase()}</span>
							<span>{formatCurrency(totalCost)}</span>
						</div>

						<div class="receipt-line-double"></div>

						<div class="receipt-section">
							<div class="receipt-heading">{m.player_shares().toUpperCase()}</div>

							{#if showNames}
								{#each playerShares as player, i (player.id)}
									<div class="receipt-item">
										<span>{player.name?.trim() || m.player_numbered({ n: i + 1 })}</span>
										<span class="dots"></span>
										<span>{formatCurrency(player.share)}</span>
									</div>
								{/each}
							{:else}
								{#each groupedByHours as [hours, players] (hours)}
									{@const groupShare = players[0]?.share ?? 0}
									{@const namedPlayers = getNamedPlayers(players)}
									{@const othersCount = getOthersCount(namedPlayers.length, players.length)}

									<div class="player-group">
										<div class="group-header">
											<span class="group-hours">[{hours}h]</span>
											<span class="group-count">{players.length}x</span>
											<span class="dots"></span>
											<span class="group-amount"
												>{formatCurrency(groupShare)} {m.each_suffix()}
											</span>
										</div>
										{#if namedPlayers.length > 0}
											<div class="group-names">
												{namedPlayers[0]}{#if othersCount > 0}, {m.and_others({
														count: othersCount
													})}{/if}
											</div>
										{/if}
									</div>
								{/each}
							{/if}
						</div>

						<div class="receipt-line-dashed"></div>

						<div class="receipt-footer">
							<div class="barcode">
								{#each [2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1] as width, idx (idx)}
									<div class="bar" style="width: {width}px; height: 22px"></div>
								{/each}
							</div>
							<div class="footer-text">
								{m.generated_with()}
							</div>
							<div class="footer-date">
								{new Date().toLocaleString()}
							</div>
						</div>

						{#if includeQR}
							<div class="receipt-line-dashed"></div>

							<PaymentQR />
						{/if}
					</div>

					<div class="torn-edge torn-bottom"></div>
				</div>
			{/if}
		</div>
	</main>

	<footer
		class="fixed inset-x-0 bottom-0 p-3 z-20 {currentTheme === 'zalopay'
			? 'bg-linear-to-t from-(--slate-100) via-(--slate-100) to-transparent'
			: 'bg-linear-to-t from-stone-200 via-stone-200 to-transparent'}"
	>
		<div class="max-w-lg mx-auto flex gap-3">
			<button class="btn-secondary flex-1 h-12" onclick={onBack}>
				<IconPencil class="w-5 h-5" />
				{m.edit()}
			</button>
			<button
				class="btn-primary flex-1 h-12"
				onclick={openShareSheet}
				disabled={isSharingImage || !receiptEl}
			>
				{#if isSharingImage}
					<IconLoader2 class="w-5 h-5 animate-spin" />
				{:else}
					<IconShare class="w-5 h-5" />
				{/if}
				{isSharingImage ? m.preparing_image() : m.share_btn()}
			</button>
		</div>
	</footer>

	<ShareSheet
		isOpen={isShareSheetOpen}
		bind:showNames
		bind:includeQR
		onClose={closeShareSheet}
		onShareImage={handleShareImage}
		onCopyText={handleCopyText}
		onDownloadImage={handleDownloadImage}
	/>

	{#if showCelebration}
		<div
			class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 pointer-events-none"
			transition:fade={{ duration: 300 }}
		>
			<span class="text-6xl animate-bounce">🎉</span>
			<span class="mt-2 text-xl font-bold text-white drop-shadow-lg">{m.celebration_shared()}</span>
		</div>
	{/if}
</div>

<style>
	/* ===================================
	   ZALOPAY COMPACT THEME
	   =================================== */
	.zp-receipt {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
	}

	.zp-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		background: var(--zp-blue-500);
	}

	.zp-header-left {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.zp-logo {
		font-size: 18px;
	}

	.zp-brand {
		font-size: 14px;
		font-weight: 700;
		color: white;
		letter-spacing: 0.01em;
	}

	.zp-status {
		display: flex;
		align-items: center;
		gap: 3px;
		padding: 3px 8px;
		background: var(--zp-green-500);
		border-radius: 4px;
		color: white;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.zp-hero {
		padding: 12px;
		text-align: center;
		border-bottom: 1px solid var(--border);
	}

	.zp-hero-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.zp-session {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
	}

	.zp-date {
		font-size: 11px;
		color: var(--ink-muted);
	}

	.zp-total {
		font-family: 'JetBrains Mono', monospace;
		font-size: 28px;
		font-weight: 700;
		color: var(--zp-blue-600);
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	.zp-stats {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
		font-size: 11px;
		color: var(--ink-muted);
		font-weight: 500;
	}

	.zp-dot {
		opacity: 0.4;
	}

	.zp-section {
		padding: 10px 12px;
		border-bottom: 1px solid var(--border);
	}

	.zp-section:last-of-type {
		border-bottom: none;
	}

	.zp-section-head {
		font-size: 10px;
		font-weight: 700;
		color: var(--ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 6px;
	}

	.zp-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 5px 0;
		font-size: 13px;
		color: var(--ink);
	}

	.zp-row.zp-muted {
		color: var(--ink-muted);
	}

	.zp-val {
		font-family: 'JetBrains Mono', monospace;
		font-weight: 600;
		font-size: 12px;
	}

	.zp-player {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 0;
	}

	.zp-avatar {
		width: 22px;
		height: 22px;
		border-radius: 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 700;
		color: white;
		flex-shrink: 0;
	}

	.zp-name {
		flex: 1;
		font-size: 13px;
		font-weight: 500;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.zp-hrs {
		font-size: 11px;
		color: var(--ink-muted);
		flex-shrink: 0;
	}

	.zp-share {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: var(--zp-blue-600);
		flex-shrink: 0;
	}

	.zp-group {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 6px 0;
	}

	.zp-badge {
		padding: 3px 6px;
		background: var(--zp-blue-500);
		color: white;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 700;
		flex-shrink: 0;
	}

	.zp-gcount {
		font-size: 12px;
		font-weight: 600;
		color: var(--ink);
	}

	.zp-gnames {
		flex: 1;
		font-size: 11px;
		color: var(--ink-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.zp-gshare {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		font-weight: 700;
		color: var(--zp-green-600);
		flex-shrink: 0;
	}

	.zp-gshare small {
		font-size: 10px;
		font-weight: 500;
		color: var(--ink-muted);
	}

	.zp-qr {
		padding: 10px 12px;
		border-top: 1px solid var(--border);
	}

	.zp-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: var(--slate-50);
		font-size: 10px;
		color: var(--ink-muted);
	}

	/* ===================================
	   THERMAL RECEIPT THEME (Original)
	   =================================== */
	.thermal-receipt {
		position: relative;
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
	}

	.thermal-paper {
		position: relative;
		background:
			url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"),
			linear-gradient(180deg, #fdfcf8 0%, #f9f7f1 20%, #f7f5ed 50%, #f5f3e9 80%, #f2f0e4 100%);
		background-blend-mode: soft-light, normal;
		padding: 16px 16px;
		font-family: 'JetBrains Mono', 'Courier New', monospace;
		color: #2d2a26;
		overflow: hidden;
	}

	.scratches {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.08;
		background-image:
			linear-gradient(90deg, transparent 0%, transparent 70%, #8b8680 70.5%, transparent 71%),
			linear-gradient(90deg, transparent 20%, #8b8680 20.3%, transparent 20.6%),
			linear-gradient(85deg, transparent 40%, #8b8680 40.2%, transparent 40.4%),
			linear-gradient(92deg, transparent 60%, #8b8680 60.1%, transparent 60.3%),
			linear-gradient(180deg, transparent 30%, #8b8680 30.2%, transparent 30.4%),
			linear-gradient(178deg, transparent 55%, #8b8680 55.1%, transparent 55.3%),
			linear-gradient(182deg, transparent 75%, #8b8680 75.2%, transparent 75.5%);
		background-size:
			100% 3px,
			100% 5px,
			100% 4px,
			100% 6px,
			2px 100%,
			3px 100%,
			2px 100%;
		background-position:
			0 15%,
			0 45%,
			0 70%,
			0 88%,
			12% 0,
			67% 0,
			89% 0;
	}

	.torn-edge {
		height: 12px;
		background: #f9f7f1;
		position: relative;
	}

	.torn-top {
		clip-path: polygon(
			0% 100%,
			2% 60%,
			4% 100%,
			6% 50%,
			8% 100%,
			10% 70%,
			12% 100%,
			14% 40%,
			16% 100%,
			18% 65%,
			20% 100%,
			22% 55%,
			24% 100%,
			26% 45%,
			28% 100%,
			30% 70%,
			32% 100%,
			34% 50%,
			36% 100%,
			38% 60%,
			40% 100%,
			42% 45%,
			44% 100%,
			46% 55%,
			48% 100%,
			50% 65%,
			52% 100%,
			54% 40%,
			56% 100%,
			58% 70%,
			60% 100%,
			62% 50%,
			64% 100%,
			66% 60%,
			68% 100%,
			70% 45%,
			72% 100%,
			74% 55%,
			76% 100%,
			78% 65%,
			80% 100%,
			82% 50%,
			84% 100%,
			86% 70%,
			88% 100%,
			90% 55%,
			92% 100%,
			94% 45%,
			96% 100%,
			98% 60%,
			100% 100%
		);
	}

	.torn-bottom {
		clip-path: polygon(
			0% 0%,
			2% 40%,
			4% 0%,
			6% 50%,
			8% 0%,
			10% 30%,
			12% 0%,
			14% 60%,
			16% 0%,
			18% 35%,
			20% 0%,
			22% 45%,
			24% 0%,
			26% 55%,
			28% 0%,
			30% 30%,
			32% 0%,
			34% 50%,
			36% 0%,
			38% 40%,
			40% 0%,
			42% 55%,
			44% 0%,
			46% 45%,
			48% 0%,
			50% 35%,
			52% 0%,
			54% 60%,
			56% 0%,
			58% 30%,
			60% 0%,
			62% 50%,
			64% 0%,
			66% 40%,
			68% 0%,
			70% 55%,
			72% 0%,
			74% 45%,
			76% 0%,
			78% 35%,
			80% 0%,
			82% 50%,
			84% 0%,
			86% 30%,
			88% 0%,
			90% 45%,
			92% 0%,
			94% 55%,
			96% 0%,
			98% 40%,
			100% 0%
		);
	}

	.receipt-store {
		text-align: center;
		margin-bottom: 10px;
	}

	.store-logo {
		font-size: 28px;
		margin-bottom: 2px;
	}

	.store-name {
		font-size: 18px;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	.store-tagline {
		font-size: 9px;
		letter-spacing: 0.2em;
		color: #6b6560;
		margin-top: 4px;
	}

	.receipt-line-double {
		border-top: 2px double #8b8680;
		margin: 8px 0;
	}

	.receipt-line-dashed {
		border-top: 1px dashed #a8a39d;
		margin: 8px 0;
	}

	.receipt-section {
		margin: 4px 0;
	}

	.receipt-title {
		font-size: 14px;
		font-weight: 600;
		text-align: center;
		margin-bottom: 4px;
	}

	.receipt-meta {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: #6b6560;
	}

	.receipt-heading {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #6b6560;
		margin-bottom: 4px;
	}

	.receipt-items {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.receipt-item {
		display: flex;
		align-items: baseline;
		font-size: 12px;
		line-height: 1.4;
	}

	.receipt-item.muted {
		color: #8b8680;
	}

	.receipt-item span:first-child {
		flex-shrink: 0;
		max-width: 60%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.receipt-item span:last-child {
		flex-shrink: 0;
		font-weight: 600;
	}

	.dots {
		flex: 1;
		border-bottom: 1px dotted #c4c0ba;
		margin: 0 6px 4px;
		min-width: 20px;
	}

	.receipt-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 16px;
		font-weight: 700;
		padding: 4px 0;
	}

	.player-group {
		margin-bottom: 6px;
	}

	.group-header {
		display: flex;
		align-items: baseline;
		font-size: 12px;
	}

	.group-hours {
		font-weight: 700;
		color: #4a4640;
		margin-right: 6px;
	}

	.group-count {
		color: #6b6560;
	}

	.group-amount {
		font-weight: 600;
		flex-shrink: 0;
	}

	.group-names {
		font-size: 10px;
		color: #8b8680;
		margin-left: 42px;
		margin-top: 2px;
		font-style: italic;
	}

	.barcode {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 1px;
		height: 28px;
		margin: 10px auto 6px;
		opacity: 0.7;
	}

	.bar {
		background: #2d2a26;
		flex-shrink: 0;
	}

	.receipt-footer {
		text-align: center;
	}

	.footer-text {
		font-size: 10px;
		color: #8b8680;
		margin-bottom: 2px;
	}

	.footer-date {
		font-size: 9px;
		color: #a8a39d;
	}

	.thermal-paper::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(
			ellipse 120% 80% at 50% 50%,
			transparent 0%,
			transparent 70%,
			rgba(139, 134, 128, 0.05) 100%
		);
	}

	.thermal-paper::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.03;
		background-image:
			radial-gradient(circle at 15% 25%, #2d2a26 0%, transparent 8%),
			radial-gradient(circle at 85% 40%, #2d2a26 0%, transparent 6%),
			radial-gradient(circle at 45% 75%, #2d2a26 0%, transparent 10%),
			radial-gradient(circle at 70% 85%, #2d2a26 0%, transparent 5%);
	}
</style>
