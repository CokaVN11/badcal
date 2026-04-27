<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import TabBar from '$lib/components/TabBar.svelte';
	import { togglePaid } from '$lib/api/sharing';
	import * as m from '$lib/paraglide/messages';
	import { toast } from 'svelte-sonner';
	import { generateImageBlob, buildImageFilename, downloadBlob } from '$lib/utils/bill-share';

	let { data }: { data: PageData } = $props();

	let activeTab = $state(0);

	// Flatten all player names in order — index maps to playerId for API calls
	const allPlayerNames = $derived(data.session.groups.flatMap((g) => g.playerNames));

	// Step 4: Theo nguoi tab — Map<string, boolean> keyed by player name (for display)
	let playerPaidMap = $state(new Map<string, boolean>(
		data.paidPlayerNames.map(name => [name, true])
	));

	async function togglePaidByName(name: string) {
		const newPaid = !playerPaidMap.get(name);
		// Optimistic update
		playerPaidMap.set(name, newPaid);
		try {
			const idx = allPlayerNames.indexOf(name);
			await togglePaid(data.session.id, idx, newPaid);
		} catch {
			// Revert on failure
			playerPaidMap.set(name, !newPaid);
		}
	}

	// Step 5: Theo doi tab — QR code
	let qrDataUrl = $state('');
	let linkCopied = $state(false);

	const shareUrl = $derived(() => {
		if (!browser) return '';
		return `${$page.url.origin}/s/${data.session.id}`;
	});

	async function generateQR() {
		if (!browser) return;
		const QRCode = (await import('qrcode')).default;
		try {
			qrDataUrl = await QRCode.toDataURL(shareUrl(), { width: 240, margin: 2 });
		} catch {
			qrDataUrl = '';
		}
	}

	async function copyLink() {
		if (!browser) return;
		try {
			await navigator.clipboard.writeText(shareUrl());
			linkCopied = true;
			toast.success(m.copied_to_clipboard());
			setTimeout(() => (linkCopied = false), 2000);
		} catch {
			toast.error(m.copy_failed());
		}
	}

	// Step 3: Copy text action
	async function copyText() {
		const lines = [
			data.session.sessionTitle,
			data.session.sessionDate,
			'',
			...data.shareResults.map(r => `${r.name}: ${r.total.toLocaleString()} VND`),
			'',
			`Tong cong: ${data.grandTotal.toLocaleString()} VND`
		];
		await navigator.clipboard.writeText(lines.join('\n'));
		toast.success(m.copied_to_clipboard());
	}

	// Step 3: Generate image action
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

		<!-- Summary tab -->
		{#if activeTab === 0}
			<div class="max-w-md mx-auto space-y-4">
				<!-- Receipt header card -->
				<div class="rounded-xl bg-surface-container-lowest p-4 border border-border">
					<h2 class="text-lg font-semibold text-ink">{data.session.sessionTitle}</h2>
					<p class="text-sm text-on-surface-variant">{data.session.sessionDate}</p>
				</div>

				<!-- Cost breakdown bento grid -->
				<div class="grid grid-cols-2 gap-3">
					<div class="rounded-xl bg-surface-container-lowest p-4 border border-border">
						<p class="text-xs text-on-surface-variant mb-1">{m.court_total_hint()}</p>
						<p class="text-xl font-semibold text-ink">{data.courtTotal.toLocaleString()} VND</p>
					</div>
					<div class="rounded-xl bg-surface-container-lowest p-4 border border-border">
						<p class="text-xs text-on-surface-variant mb-1">{m.share_hint_add_costs()}</p>
						<p class="text-xl font-semibold text-ink">{data.extraTotal.toLocaleString()} VND</p>
					</div>
					<div class="col-span-2 rounded-xl bg-primary-container p-4 border border-primary/20">
						<p class="text-xs text-on-primary-container mb-1">Tong cong</p>
						<p class="text-2xl font-bold text-on-primary-container">{data.grandTotal.toLocaleString()} VND</p>
					</div>
				</div>

				<!-- Minute-proportion bars -->
				<div class="rounded-xl bg-surface-container-lowest p-4 border border-border space-y-3">
					<p class="text-sm font-semibold text-ink mb-3">{m.breakdown()}</p>
					{#each data.shareResults as r (r.name)}
						<div class="space-y-1">
							<div class="flex justify-between text-sm">
								<span class="text-ink">{r.name}</span>
								<span class="text-ink font-medium">{r.total.toLocaleString()} VND</span>
							</div>
							<div class="h-2 bg-surface-container rounded-full overflow-hidden">
								<div
									class="h-full bg-primary rounded-full transition-all duration-300"
									style="width: {r.ratio * 100}%"
								></div>
							</div>
							<p class="text-xs text-on-surface-variant text-right">
								{m.ratio()}: {Math.round(r.ratio * 100)}%
							</p>
						</div>
					{/each}
				</div>
			</div>

		<!-- By Person tab -->
		{:else if activeTab === 1}
			<div class="max-w-md mx-auto space-y-4">
				{#each data.shareResults as r (r.name)}
					{@const isPaid = playerPaidMap.get(r.name) ?? false}
					<div class="rounded-xl bg-surface-container-lowest p-4 border border-border">
						<div class="flex items-center justify-between mb-3">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
									<span class="text-sm font-semibold text-on-primary-container">
										{r.name.charAt(0).toUpperCase()}
									</span>
								</div>
								<div>
									<p class="font-semibold text-ink">{r.name}</p>
									<p class="text-xs text-on-surface-variant">
										{Math.round(r.ratio * 100)}% — {r.playerMinutes} phut
									</p>
								</div>
							</div>
							<button
								class="btn h-10 min-w-24"
								class:btn-success={isPaid}
								class:btn-outline={!isPaid}
								onclick={() => togglePaidByName(r.name)}
							>
								{isPaid ? 'Da thanh toan' : 'Chua thanh toan'}
							</button>
						</div>
						<div class="h-2 bg-surface-container rounded-full overflow-hidden mb-2">
							<div
								class="h-full bg-primary rounded-full transition-all duration-300"
								style="width: {r.ratio * 100}%"
							></div>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-on-surface-variant">San ({m.hours_unit()})</span>
							<span class="text-ink font-medium">{r.courtShare.toLocaleString()} VND</span>
						</div>
						{#if r.extraShare > 0}
							<div class="flex justify-between text-sm mt-1">
								<span class="text-on-surface-variant">Phu troi</span>
								<span class="text-ink font-medium">{r.extraShare.toLocaleString()} VND</span>
							</div>
						{/if}
						<div class="flex justify-between text-sm mt-2 pt-2 border-t border-border">
							<span class="font-semibold text-ink">Tong cong</span>
							<span class="font-bold text-ink">{r.total.toLocaleString()} VND</span>
						</div>
					</div>
				{/each}
			</div>

		<!-- Following tab -->
		{:else if activeTab === 2}
			<div class="max-w-sm mx-auto space-y-6 text-center">
				<div>
					<h2 class="text-xl font-semibold text-ink">{data.session.sessionTitle}</h2>
					<p class="text-sm text-on-surface-variant">{data.session.sessionDate}</p>
				</div>

				{#if qrDataUrl}
					<div class="flex justify-center rounded-2xl bg-surface-container-lowest p-4 border border-border">
						<img src={qrDataUrl} alt="QR code for share link" class="w-60 h-60" />
					</div>
				{:else}
					<div class="flex justify-center rounded-2xl bg-surface-container-lowest p-4 border border-border">
						<div class="w-60 h-60 flex items-center justify-center text-on-surface-variant">
							Loading QR...
						</div>
					</div>
				{/if}

				<div class="rounded-xl bg-surface-container-lowest p-4 border border-border">
					<p class="text-xs text-on-surface-variant mb-2">Share link</p>
					<p class="text-sm font-mono text-ink break-all">{shareUrl()}</p>
				</div>

				<button class="btn btn-primary w-full h-12" onclick={copyLink}>
					{linkCopied ? m.copied_to_clipboard() : m.copy_text_btn()}
				</button>
			</div>
		{/if}
	</main>

	<!-- Sticky bottom action bar -->
	<div class="sticky bottom-0 z-20 bg-surface-container-lowest border-t border-border p-4">
		<div class="max-w-md mx-auto flex gap-3">
			<button class="btn btn-outline flex-1 h-12" onclick={copyText}>
				{m.copy_text_btn()}
			</button>
			<button class="btn btn-outline flex-1 h-12" onclick={generateImage}>
				{m.share_image_btn()}
			</button>
			<button
				class="btn btn-primary flex-1 h-12"
				onclick={() => { activeTab = 2; if (!qrDataUrl) generateQR(); }}
			>
				{m.share_link() ?? 'Chia se'}
			</button>
		</div>
	</div>
</div>