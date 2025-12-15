<script lang="ts">
	// ABOUTME: Bill Preview - shareable receipt-style view for social media/screenshot
	// ABOUTME: Clean, minimal design optimized for exporting and sharing

	import { m } from '$lib/paraglide/messages.js';
	import {
		formatCurrency,
		formatDate,
		groupByKey,
		getGroupColor,
		getNamedPlayers,
		getOthersCount
	} from '$lib/utils';
	import type { AdditionalCost, PlayerShare } from '$lib/types';
	import { tick } from 'svelte';
	import {
		IconPingPong,
		IconCalendar,
		IconUsers,
		IconClock,
		IconLoader2,
		IconShare,
		IconCopy,
		IconChevronLeft,
		IconPencil
	} from '@tabler/icons-svelte-runes';
	import { toast } from 'svelte-sonner';
	import HoursBadge from './shared/HoursBadge.svelte';

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

	function createExportElement(source: HTMLElement): HTMLElement {
		const el = source.cloneNode(true) as HTMLElement;
		el.classList.remove('animate-pop-in');
		Object.assign(el.style, {
			width: '540px',
			position: 'fixed',
			left: '-10000px',
			top: '0',
			transform: 'none',
			pointerEvents: 'none',
			opacity: '1',
			visibility: 'visible'
		});
		return el;
	}

	async function generateImageBlob(element: HTMLElement): Promise<Blob> {
		const { toBlob } = await import('html-to-image');

		// Small delay to ensure styles are computed
		await new Promise((resolve) => requestAnimationFrame(resolve));

		const blob = await toBlob(element, {
			cacheBust: true,
			pixelRatio: 2,
			backgroundColor: '#ffffff',
			style: {
				transform: 'none',
				opacity: '1'
			},
			filter: (node) => {
				// Exclude any nodes that might cause issues
				if (node instanceof Element) {
					const tagName = node.tagName?.toLowerCase();
					// Skip script and style tags
					if (tagName === 'script' || tagName === 'noscript') return false;
				}
				return true;
			}
		});
		if (!blob) throw new Error('Failed to generate image');
		return blob;
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

		let exportEl: HTMLElement | null = null;
		try {
			await tick();
			await waitForFonts();

			exportEl = createExportElement(receiptEl);
			document.body.append(exportEl);

			// Wait for next frame to ensure element is rendered
			await new Promise((resolve) => setTimeout(resolve, 100));

			const blob = await generateImageBlob(exportEl);
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
			exportEl?.remove();
			isSharingImage = false;
		}
	}
</script>

{#snippet costRow(label: string, amount: number, muted?: boolean)}
	<div class="flex justify-between items-center">
		<span class="text-[13px] {muted ? 'text-slate-500' : 'text-slate-600'}">{label}</span>
		<span class="font-mono text-[13px] {muted ? 'text-slate-700' : 'text-slate-800'}"
			>{formatCurrency(amount)}</span
		>
	</div>
{/snippet}

<div class="min-h-dvh bg-(--slate-100) flex flex-col">
	<header
		class="bg-white/95 backdrop-blur-md border-b border-(--border) px-4 py-2 sticky top-0 z-30"
	>
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<button class="btn-icon" onclick={onBack} aria-label={m.edit()}>
				<IconChevronLeft class="w-5 h-5" />
			</button>
			<h1 class="text-lg font-semibold text-(--ink) flex-1">{m.bill_preview_heading()}</h1>
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
								<IconUsers class="w-3.5 h-3.5" />
								{playerShares.length} • <IconClock class="w-3.5 h-3.5" />
								{totalHours}{m.hours_unit()}
							</div>
						</div>
					</div>
				</div>

				<div class="receipt-header">
					<h2 class="text-lg font-bold text-slate-800">{sessionTitle || m.app_title()}</h2>
				</div>

				<div class="px-4 py-3">
					<h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
						{m.breakdown()}
					</h3>

					<div class="space-y-1.5">
						{#if courtPrice > 0}
							{@render costRow(m.court_fee(), courtPrice)}
						{/if}
						{#if shuttlecockTotal > 0}
							{@render costRow(`${m.shuttlecocks()} (×${shuttlecockCount})`, shuttlecockTotal)}
						{/if}
						{#each visibleExtras as cost (cost.id)}
							{@render costRow(cost.label, cost.amount)}
						{/each}
						{#if remainingExtras.length > 0}
							{@render costRow(
								m.more_items({ count: remainingExtras.length }),
								remainingExtrasTotal,
								true
							)}
						{/if}
					</div>

					<div class="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
						<span class="font-semibold text-slate-900">{m.total_cost()}</span>
						<span class="font-mono text-lg font-bold text-blue-700"
							>{formatCurrency(totalCost)}</span
						>
					</div>
				</div>

				<hr class="receipt-divider mx-4" />

				<div class="px-4 pb-4">
					<h3 class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
						{m.player_shares()}
					</h3>

					<div class="space-y-2">
						{#each groupedByHours as [hours, players], groupIndex (hours)}
							{@const colorScheme = getGroupColor(groupIndex)}
							{@const groupShare = players[0]?.share ?? 0}
							{@const namedPlayers = getNamedPlayers(players)}
							{@const othersCount = getOthersCount(namedPlayers.length, players.length)}
							<div class="receipt-group rounded-xl overflow-hidden border border-slate-200">
								<div class="flex items-center gap-2 p-2 bg-gradient-to-r from-slate-50 to-white">
									<HoursBadge {hours} {colorScheme} size="xs" />
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-1.5">
											<span class="text-sm font-bold text-slate-900">{players.length}</span>
											<span class="text-xs text-slate-600">
												{players.length === 1 ? m.player() : m.players_count()}
											</span>
										</div>
									</div>
									<div
										class="text-xs font-mono font-bold {colorScheme.text} {colorScheme.light} px-2 py-1 rounded-lg"
									>
										{formatCurrency(groupShare)}{m.each_suffix()}
									</div>
								</div>

								{#if namedPlayers.length > 0}
									<div class="bg-white px-3 py-2">
										<p class="text-[13px] leading-relaxed">
											<span class="text-slate-900 font-medium">{namedPlayers[0]}</span>
											{#if othersCount > 0}
												<span class="text-slate-400">{m.and_others({ count: othersCount })}</span>
											{/if}
										</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<div class="bg-slate-50 px-4 py-3 text-center border-t border-slate-200">
					<p class="text-xs text-slate-400">{m.generated_with()} • {m.app_title()}</p>
				</div>
			</div>
		</div>
	</main>

	<footer
		class="fixed inset-x-0 bottom-0 p-3 bg-linear-to-t from-white via-white to-transparent z-20"
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
