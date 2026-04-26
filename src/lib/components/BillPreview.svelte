<script lang="ts">
	// ABOUTME: Bill Preview - dual theme receipt for social media/screenshot
	// ABOUTME: Supports thermal paper and modern ZaloPay fintech styles

	import { m } from '$lib/paraglide/messages.js';
	import { formatCurrency, formatDate, groupByKey, triggerHaptic, getInitial } from '$lib/utils/index';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ExtraCost, Player, Group, CourtBlock } from '$lib/types';
	import { tick, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { browser } from '$lib/env';
	import { appStorage } from '$lib/stores/storage.svelte';
	import {
		IconLoader2,
		IconShare,
		IconCopy,
		IconChevronLeft,
		IconPencil,
		IconReceipt,
		IconCreditCard
	} from '@tabler/icons-svelte-runes';
	import { toast } from 'svelte-sonner';
	import BillZaloPay from './bill/BillZaloPay.svelte';
	import BillThermal from './bill/BillThermal.svelte';
	import ShareSheet from './ShareSheet.svelte';
	import { loadPaymentInfo, getProviderDisplayName } from '$lib/utils/vietqr';
	import {
		generateImageBlob,
		tryNativeShare,
		downloadBlob,
		buildImageFilename,
		waitForFonts,
		type BillTheme
	} from '$lib/utils/bill-share';

	type Props = {
		sessionTitle: string;
		sessionDate: string;
		startTime: string | null;
		courtPrice: number;
		shuttlecockPrice: number;
		shuttlecockCount: number;
		additionalCosts: ExtraCost[];
		playerShares: Player[];
		totalCost: number;
		onBack: () => void;
		groups?: Group[];
		courtBlocks?: CourtBlock[];
		extraCosts?: ExtraCost[];
	};

	let { sessionTitle, sessionDate, startTime, courtPrice, shuttlecockPrice, shuttlecockCount, additionalCosts, playerShares, totalCost, onBack, groups, courtBlocks, extraCosts }: Props = $props();

	type BillComponentHandle = {
		getElement: () => HTMLDivElement | null;
	};

	let billZaloPayComponent = $state<BillComponentHandle | null>(null);
	let billThermalComponent = $state<BillComponentHandle | null>(null);
	let isSharingImage = $state(false);
	let isCopyingText = $state(false);
	let isShareSheetOpen = $state(false);
	let showNames = $state(false);
	let includeQR = $state(true);
	let showCelebration = $state(false);

	// Theme state — synced with localStorage automatically
	let currentTheme: BillTheme = $state(appStorage.billTheme as BillTheme);

	let themeClasses = $derived(currentTheme === 'zalopay' ? {
		bg: 'bg-surface-muted',
		header: 'bg-white/90 border-border',
		text: 'text-ink',
		toggleBtn: 'bg-primary-soft text-primary hover:bg-primary-soft-strong',
		footer: 'bg-linear-to-t from-white via-white/96 to-transparent'
	} : {
		bg: 'bg-stone-200',
		header: 'bg-white/95 border-stone-300',
		text: 'text-stone-800',
		toggleBtn: 'bg-stone-100 text-stone-600 hover:bg-stone-200',
		footer: 'bg-linear-to-t from-stone-200 via-stone-200 to-transparent'
	});

	let receiptEl: HTMLDivElement | null = $derived(currentTheme === 'zalopay' ? billZaloPayComponent?.getElement() ?? null : billThermalComponent?.getElement() ?? null);

	onMount(() => {
		// Sync currentTheme with storage on mount
		if (appStorage.billTheme === 'thermal' || appStorage.billTheme === 'zalopay') {
			currentTheme = appStorage.billTheme as BillTheme;
		}
	});

	function toggleTheme() {
		currentTheme = currentTheme === 'thermal' ? 'zalopay' : 'thermal';
		if (browser) appStorage.billTheme = currentTheme;
		triggerHaptic('light');
	}

	let paidPlayerIds = new SvelteSet<number>();
	let paidCount = $derived(paidPlayerIds.size);
	let allPaid = $derived(playerShares.length > 0 && paidCount === playerShares.length);
	let remainingAmount = $derived(
		playerShares.filter(p => !paidPlayerIds.has(p.id)).reduce((sum, p) => sum + (p.share ?? 0), 0)
	);

	function togglePaid(id: number) {
		if (paidPlayerIds.has(id)) {
			paidPlayerIds.delete(id);
		} else {
			paidPlayerIds.add(id);
			triggerHaptic('light');
		}
	}

	let shuttlecockTotal = $derived(shuttlecockPrice * shuttlecockCount);
	let groupedByHours = $derived(groupByKey(playerShares, (p) => p.hours));

	function generateShareText(): string {
		const lines = [
			`🏸 ${sessionTitle || m.app_title()}`,
			`📅 ${formatDate(sessionDate)}`,
			'',
			`💰 ${m.total_cost()}: ${formatCurrency(totalCost)}`,
			'',
			`${m.breakdown()}:`
		];
		if (courtPrice > 0) lines.push(`• ${m.court_fee()}: ${formatCurrency(courtPrice)}`);
		if (shuttlecockTotal > 0) lines.push(`• ${m.shuttlecocks()}: ${formatCurrency(shuttlecockTotal)}`);
		additionalCosts.filter((c) => c.amount > 0).forEach((c) => lines.push(`• ${c.label}: ${formatCurrency(c.amount)}`));
		lines.push('', `${m.player_shares()}:`);
		if (showNames) {
			playerShares.forEach((p, i) => lines.push(`• ${p.name?.trim() || m.player_numbered({ n: i + 1 })}: ${formatCurrency(p.share ?? 0)}`));
		} else {
			for (const [hours, players] of groupedByHours) {
				lines.push(`• [${hours}${m.hours_unit()}] ${players.length}x: ${formatCurrency(players[0]?.share ?? 0)} ${m.each_suffix()}`);
			}
		}
		if (includeQR) {
			const paymentInfo = loadPaymentInfo();
			if (paymentInfo) {
				lines.push('', `🏦 ${m.qr_bank_label()}: ${getProviderDisplayName(paymentInfo.providerKey)}`, `📝 ${paymentInfo.accountNumber}`);
				if (paymentInfo.accountName) lines.push(`👤 ${paymentInfo.accountName}`);
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

	async function shareBillImage() {
		if (!receiptEl) return;
		isSharingImage = true;
		try {
			await tick();
			await waitForFonts();
			const blob = await generateImageBlob(receiptEl, currentTheme);
			const filename = buildImageFilename(sessionTitle || m.app_title(), sessionDate);
			const file = new File([blob], filename, { type: 'image/png' });
			if (await tryNativeShare(file, sessionTitle || m.app_title(), generateShareText())) {
				showCelebration = true;
				triggerHaptic('medium');
				setTimeout(() => (showCelebration = false), 1500);
			} else {
				downloadBlob(blob, filename);
				toast.success(m.image_downloaded());
				showCelebration = true;
				triggerHaptic('medium');
				setTimeout(() => (showCelebration = false), 1500);
			}
		} catch (e) {
			console.error('Failed to share image:', e);
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
			const blob = await generateImageBlob(receiptEl, currentTheme);
			downloadBlob(blob, buildImageFilename(sessionTitle || m.app_title(), sessionDate));
			toast.success(m.image_downloaded());
		} catch (e) {
			console.error('Failed to download image:', e);
			toast.error(m.share_image_failed());
		} finally {
			isSharingImage = false;
		}
	}

</script>

<div class="min-h-dvh flex flex-col {themeClasses.bg}">
	<header class="backdrop-blur-md border-b px-4 py-2 sticky top-0 z-30 {themeClasses.header}">
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<button class="btn-icon" onclick={onBack} aria-label={m.edit()}>
				<IconChevronLeft class="w-5 h-5" />
			</button>
			<h1 class="text-lg font-semibold flex-1 {themeClasses.text}">{m.bill_preview_heading()}</h1>
			<button
				class="p-2 rounded-lg transition-colors {themeClasses.toggleBtn}"
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
			<button class="btn-icon" onclick={copyShareText} disabled={isCopyingText} aria-label={m.copy_text_btn()}>
				<IconCopy class="w-5 h-5" />
			</button>
		</div>
	</header>

	<main class="flex-1 p-4 pb-28">
		<div class="max-w-md mx-auto">
			{#if currentTheme === 'zalopay'}
				<BillZaloPay
					bind:this={billZaloPayComponent}
					{sessionTitle} {sessionDate} {startTime} {courtPrice} {shuttlecockPrice} {shuttlecockCount}
					{additionalCosts} {playerShares} {totalCost} {showNames} {includeQR}
					{groups} {courtBlocks} {extraCosts}
				/>
			{:else}
				<BillThermal
					bind:this={billThermalComponent}
					{sessionTitle} {sessionDate} {startTime} {courtPrice} {shuttlecockPrice} {shuttlecockCount}
					{additionalCosts} {playerShares} {totalCost} {showNames} {includeQR}
					{groups} {courtBlocks} {extraCosts}
				/>
			{/if}
		<!-- Settlement tracker -->
		<div class="mt-4 rounded-2xl bg-white shadow-sm border border-border overflow-hidden">
			<div class="flex items-center justify-between px-4 py-3 border-b border-border">
				<span class="text-sm font-semibold text-ink">{m.settlement_heading()}</span>
				{#if allPaid}
					<span class="text-xs font-semibold text-green-600">{m.settlement_all_paid()}</span>
				{:else}
					<span class="text-xs text-ink-muted">
						{m.settlement_progress({ paid: paidCount, total: playerShares.length })}
						{#if remainingAmount > 0}· {m.settlement_remaining({ amount: formatCurrency(remainingAmount) })}{/if}
					</span>
				{/if}
			</div>
			{#each playerShares as player (player.id)}
				{@const isPaid = paidPlayerIds.has(player.id)}
				{@const displayName = player.name?.trim() || m.player_numbered({ n: playerShares.indexOf(player) + 1 })}
				<button
					type="button"
					class="w-full flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 text-left transition-colors {isPaid ? 'bg-green-50' : 'hover:bg-surface-muted active:bg-surface-muted'}"
					onclick={() => togglePaid(player.id)}
				>
					<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors {isPaid ? 'bg-green-500 text-white' : 'bg-slate-100 text-ink-soft'}">
						{#if isPaid}✓{:else}{getInitial(displayName)}{/if}
					</div>
					<span class="flex-1 text-sm font-medium transition-colors {isPaid ? 'text-ink-muted line-through' : 'text-ink'}">
						{displayName}
					</span>
					<span class="text-sm font-mono font-semibold shrink-0 {isPaid ? 'text-green-600' : 'text-ink'}">
						{formatCurrency(player.share ?? 0)}
					</span>
				</button>
			{/each}
		</div>
		</div>
	</main>

	<footer class="fixed inset-x-0 bottom-0 p-3 z-20 {themeClasses.footer}">
		<div class="max-w-lg mx-auto flex gap-3">
			<button class="btn-secondary flex-1 h-12" onclick={onBack}>
				<IconPencil class="w-5 h-5" /> {m.edit()}
			</button>
			<button class="btn-primary flex-1 h-12" onclick={() => (isShareSheetOpen = true)} disabled={isSharingImage || !receiptEl}>
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
		onClose={() => (isShareSheetOpen = false)}
		onShareImage={() => { isShareSheetOpen = false; tick().then(shareBillImage); }}
		onCopyText={() => { isShareSheetOpen = false; copyShareText(); }}
		onDownloadImage={() => { isShareSheetOpen = false; tick().then(downloadBillImage); }}
	/>
	{#if showCelebration}
		<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 pointer-events-none" transition:fade={{ duration: 300 }}>
			<span class="text-6xl animate-bounce">🎉</span>
			<span class="mt-2 text-xl font-bold text-white drop-shadow-lg">{m.celebration_shared()}</span>
		</div>
	{/if}
</div>
