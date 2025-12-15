<script lang="ts">
	// ABOUTME: Bill Preview - thermal paper receipt style for social media/screenshot
	// ABOUTME: Realistic heated paper design with scratches and worn texture

	import { m } from '$lib/paraglide/messages.js';
	import {
		formatCurrency,
		formatDate,
		groupByKey,
		getNamedPlayers,
		getOthersCount
	} from '$lib/utils';
	import type { AdditionalCost, PlayerShare } from '$lib/types';
	import { tick } from 'svelte';
	import {
		IconLoader2,
		IconShare,
		IconCopy,
		IconChevronLeft,
		IconPencil
	} from '@tabler/icons-svelte-runes';
	import { toast } from 'svelte-sonner';

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
		playerShares.forEach((p, i) => {
			const name = p.name?.trim() || m.player_numbered({ n: i + 1 });
			lines.push(`• ${name}: ${formatCurrency(p.share)}`);
		});

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

		try {
			const dataUrl = await toPng(element, {
				cacheBust: true,
				pixelRatio: 2,
				backgroundColor: 'transparent',
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
			if (!shared) {
				downloadBlob(blob, filename);
				toast.success(m.image_downloaded());
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
</script>

<div class="min-h-dvh bg-stone-200 flex flex-col">
	<header
		class="bg-white/95 backdrop-blur-md border-b border-stone-300 px-4 py-2 sticky top-0 z-30"
	>
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<button class="btn-icon" onclick={onBack} aria-label={m.edit()}>
				<IconChevronLeft class="w-5 h-5" />
			</button>
			<h1 class="text-lg font-semibold text-stone-800 flex-1">{m.bill_preview_heading()}</h1>
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
			<div class="thermal-receipt animate-pop-in" bind:this={receiptEl}>
				<div class="torn-edge torn-top"></div>

				<div class="thermal-paper">
					<div class="scratches"></div>

					<div class="receipt-store">
						<div class="store-logo">🏸</div>
						<div class="store-name">{m.app_title()}</div>
						<div class="store-tagline">BADMINTON COST SPLITTER</div>
					</div>

					<div class="receipt-line-double"></div>

					<div class="receipt-section">
						<div class="receipt-title">{sessionTitle || 'Session'}</div>
						<div class="receipt-meta">
							<span>{formatDate(sessionDate)}</span>
							<span>{playerShares.length} players • {totalHours}h</span>
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

						{#each groupedByHours as [hours, players] (hours)}
							{@const groupShare = players[0]?.share ?? 0}
							{@const namedPlayers = getNamedPlayers(players)}
							{@const othersCount = getOthersCount(namedPlayers.length, players.length)}

							<div class="player-group">
								<div class="group-header">
									<span class="group-hours">[{hours}h]</span>
									<span class="group-count">{players.length}x</span>
									<span class="dots"></span>
									<span class="group-amount">{formatCurrency(groupShare)}/ea</span>
								</div>
								{#if namedPlayers.length > 0}
									<div class="group-names">
										{namedPlayers[0]}{#if othersCount > 0}, +{othersCount} more{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>

					<div class="receipt-line-dashed"></div>

					<div class="receipt-footer">
						<div class="barcode">
							{#each [2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1] as width, idx (idx)}
								<div class="bar" style="width: {width}px; height: {22 + (idx % 3) * 6}px"></div>
							{/each}
						</div>
						<div class="footer-text">
							{m.generated_with()}
						</div>
						<div class="footer-date">
							{new Date().toLocaleString()}
						</div>
					</div>
				</div>

				<div class="torn-edge torn-bottom"></div>
			</div>
		</div>
	</main>

	<footer
		class="fixed inset-x-0 bottom-0 p-3 bg-linear-to-t from-stone-200 via-stone-200 to-transparent z-20"
	>
		<div class="max-w-lg mx-auto flex gap-3">
			<button class="btn-secondary flex-1 h-12" onclick={onBack}>
				<IconPencil class="w-5 h-5" />
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

<style>
	/* Thermal Paper Receipt Styles */
	.thermal-receipt {
		position: relative;
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
	}

	.thermal-paper {
		position: relative;
		background:
			/* Subtle noise texture */
			url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"),
			/* Paper gradient - slightly yellowed */
			linear-gradient(180deg, #fdfcf8 0%, #f9f7f1 20%, #f7f5ed 50%, #f5f3e9 80%, #f2f0e4 100%);
		background-blend-mode: soft-light, normal;
		padding: 24px 20px;
		font-family: 'JetBrains Mono', 'Courier New', monospace;
		color: #2d2a26;
		overflow: hidden;
	}

	/* Scratches overlay */
	.scratches {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.08;
		background-image:
			/* Horizontal scratches */
			linear-gradient(90deg, transparent 0%, transparent 70%, #8b8680 70.5%, transparent 71%),
			linear-gradient(90deg, transparent 20%, #8b8680 20.3%, transparent 20.6%),
			linear-gradient(85deg, transparent 40%, #8b8680 40.2%, transparent 40.4%),
			linear-gradient(92deg, transparent 60%, #8b8680 60.1%, transparent 60.3%),
			/* Vertical scratches */
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

	/* Torn paper edges */
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

	/* Store header */
	.receipt-store {
		text-align: center;
		margin-bottom: 16px;
	}

	.store-logo {
		font-size: 36px;
		margin-bottom: 4px;
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

	/* Lines */
	.receipt-line-double {
		border-top: 2px double #8b8680;
		margin: 12px 0;
	}

	.receipt-line-dashed {
		border-top: 1px dashed #a8a39d;
		margin: 12px 0;
	}

	/* Sections */
	.receipt-section {
		margin: 8px 0;
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
		margin-bottom: 8px;
	}

	/* Items */
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

	/* Total */
	.receipt-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 16px;
		font-weight: 700;
		padding: 8px 0;
	}

	/* Player groups */
	.player-group {
		margin-bottom: 10px;
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

	/* Barcode */
	.barcode {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 1px;
		height: 35px;
		margin: 16px auto 8px;
		opacity: 0.7;
	}

	.bar {
		background: #2d2a26;
		flex-shrink: 0;
	}

	/* Footer */
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

	/* Thermal fade effect - subtle darker edges */
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

	/* Heat marks - random darker spots */
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
