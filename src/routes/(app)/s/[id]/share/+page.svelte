<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import * as m from '$lib/paraglide/messages';
	import { toast } from 'svelte-sonner';

	let { data }: { data: PageData } = $props();

	let qrDataUrl = $state('');
	let copied = $state(false);

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
			copied = true;
			toast.success(m.copied_to_clipboard());
			setTimeout(() => (copied = false), 2000);
		} catch {
			toast.error(m.copy_failed());
		}
	}

	onMount(() => {
		generateQR();
	});
</script>

<div class="min-h-dvh flex flex-col bg-(--surface-muted)">
	<header class="backdrop-blur-md border-b px-4 py-2 sticky top-0 z-30 bg-white/90 border-(--border)">
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<a href={`/s/${data.session.id}`} class="text-(--ink-muted) hover:text-(--ink)">← Back</a>
			<h1 class="text-lg font-semibold flex-1 text-(--ink)">{m.share_sheet_title()}</h1>
		</div>
	</header>

	<main class="flex-1 p-4 pb-28 flex flex-col items-center justify-center">
		<div class="max-w-sm mx-auto w-full space-y-6 text-center">
			<!-- Session info -->
			<div>
				<h2 class="text-xl font-semibold text-(--ink)">{data.session.sessionTitle}</h2>
				<p class="text-sm text-(--ink-muted)">{data.session.sessionDate}</p>
			</div>

			<!-- QR Code -->
			{#if qrDataUrl}
				<div class="flex justify-center rounded-2xl bg-white p-4 shadow-sm border border-(--border)">
					<img src={qrDataUrl} alt="QR code for share link" class="w-60 h-60" />
				</div>
			{:else}
				<div class="flex justify-center rounded-2xl bg-white p-4 shadow-sm border border-(--border)">
					<div class="w-60 h-60 flex items-center justify-center text-(--ink-muted)">
						Loading QR...
					</div>
				</div>
			{/if}

			<!-- Share URL -->
			<div class="rounded-2xl bg-white shadow-sm border border-(--border) p-4">
				<p class="text-xs text-(--ink-muted) mb-2">Share link</p>
				<p class="text-sm font-mono text-(--ink) break-all">{shareUrl()}</p>
			</div>

			<!-- Copy button -->
			<button
				class="btn btn-primary w-full h-12"
				onclick={copyLink}
			>
				{copied ? m.copied_to_clipboard() : m.copy_text_btn()}
			</button>
		</div>
	</main>
</div>
