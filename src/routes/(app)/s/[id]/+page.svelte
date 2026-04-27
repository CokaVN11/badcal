<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import TabBar from '$lib/components/TabBar.svelte';
	import { togglePaid } from '$lib/api/sharing';
	import * as m from '$lib/paraglide/messages';
	import { toast } from 'svelte-sonner';
	import { generateImageBlob, buildImageFilename, downloadBlob } from '$lib/utils/bill-share';
	import SummaryTab from './components/SummaryTab.svelte';
	import ByPersonTab from './components/ByPersonTab.svelte';
	import FollowingTab from './components/FollowingTab.svelte';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: PageData } = $props();

	let activeTab = $state(0);

	// Flatten all player names in order — index maps to playerId for API calls
	const allPlayerNames = $derived(data.session.groups.flatMap((g) => g.playerNames));

	// Player name → array index map for O(1) API calls
	const playerNameToIdx = $derived(
		new Map(allPlayerNames.map((name, idx) => [name, idx]))
	);

	// Per-player paid status map keyed by player name
	const playerPaidMap = $state(new Map<string, boolean>(
		data.paidPlayerNames.map(name => [name, true])
	));

	async function togglePaidByName(name: string) {
		const newPaid = !playerPaidMap.get(name);
		playerPaidMap.set(name, newPaid);
		try {
			const idx = playerNameToIdx.get(name);
			if (idx === undefined) return;
			await togglePaid(data.session.id, idx, newPaid);
		} catch {
			playerPaidMap.set(name, !newPaid);
		}
	}

	// QR code
	let qrDataUrl = $state<string | null>(null);
	let linkCopied = $state(false);

	const shareUrl = $derived.by(() => {
		if (!browser) return '';
		return `${$page.url.origin}/s/${data.session.id}`;
	});

	async function generateQR() {
		if (!browser) return;
		qrDataUrl = null; // distinct from error state
		try {
			const QRCode = (await import('qrcode')).default;
			qrDataUrl = await QRCode.toDataURL(shareUrl, { width: 240, margin: 2 });
		} catch {
			qrDataUrl = '';
		}
	}

	async function copyLink() {
		if (!browser) return;
		try {
			await navigator.clipboard.writeText(shareUrl);
			linkCopied = true;
			toast.success(m.copied_to_clipboard());
			setTimeout(() => (linkCopied = false), 2000);
		} catch {
			toast.error(m.copy_failed());
		}
	}

	// Receipt text for clipboard
	const shareText = $derived.by(() => [
		data.session.sessionTitle,
		data.session.sessionDate,
		'',
		...data.shareResults.map(r => `${r.name}: ${r.total.toLocaleString()} VND`),
		'',
		`Tong cong: ${data.grandTotal.toLocaleString()} VND`
	].join('\n'));

	async function copyText() {
		await navigator.clipboard.writeText(shareText);
		toast.success(m.copied_to_clipboard());
	}

	// Generate image action
	async function generateImage() {
		toast.success(m.preparing_image());
		const el = document.querySelector('.receipt-body') as HTMLElement;
		if (!el) return;
		try {
			const blob = await generateImageBlob(el, 'thermal');
			downloadBlob(blob, buildImageFilename(data.session.sessionTitle, data.session.sessionDate));
			toast.success(m.image_downloaded());
		} catch {
			toast.error(m.share_image_failed());
		}
	}

	// Activate QR generation when switching to following tab
	$effect(() => {
		if (activeTab === 2 && !qrDataUrl) {
			generateQR();
		}
	});
</script>

<div class="min-h-dvh flex flex-col bg-surface-muted">
	<!-- Sticky header -->
	<header class="sticky top-0 z-30 bg-surface-container-lowest border-b border-border">
		<div class="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
			<button onclick={() => history.back()} class="text-ink-muted hover:text-ink">
				←
			</button>
			<h1 class="text-lg font-semibold flex-1 text-ink">{m.bill_preview_heading()}</h1>
			<a href={`/s/${data.session.id}/review`} class="text-sm text-primary underline">Review</a>
		</div>
		<div class="max-w-lg mx-auto px-4 pb-3">
			<TabBar
				tabs={[m.summary_tab(), m.by_person_tab(), m.following_tab()]}
				bind:active={activeTab}
			/>
		</div>
	</header>

	<!-- Tab content -->
	<main class="flex-1 p-4 pb-28 receipt-body">
		{#if activeTab === 0}
			<SummaryTab
				sessionTitle={data.session.sessionTitle}
				sessionDate={data.session.sessionDate}
				startTime={null}
				courtPrice={data.courtTotal}
				shuttlecockPrice={0}
				shuttlecockCount={0}
				additionalCosts={data.session.extraCosts}
				totalCost={data.grandTotal}
				groups={data.session.groups}
				courtBlocks={data.session.courtBlocks}
				extraCosts={data.session.extraCosts}
			/>
		{:else if activeTab === 1}
			<ByPersonTab
				shareResults={data.shareResults}
				playerPaidMap={playerPaidMap}
				onTogglePaid={togglePaidByName}
			/>
		{:else if activeTab === 2}
			<FollowingTab
				sessionTitle={data.session.sessionTitle}
				sessionDate={data.session.sessionDate}
				{qrDataUrl}
				shareUrl={shareUrl}
				{linkCopied}
				onCopyLink={copyLink}
			/>
		{/if}
	</main>

	<!-- Sticky bottom action bar -->
	<div class="sticky bottom-0 z-20 bg-surface-container-lowest border-t border-border p-4">
		<div class="max-w-md mx-auto flex gap-3 justify-between">
			<Button variant="outline" onclick={copyText}>
				{m.copy_text_btn()}
			</Button>
			<Button variant="outline" onclick={generateImage}>
				{m.share_image_btn()}
			</Button>
			<Button
				onclick={() => { activeTab = 2; if (!qrDataUrl) generateQR(); }}
			>
				{m.share_link() ?? 'Share'}
			</Button>
		</div>
	</div>
</div>
