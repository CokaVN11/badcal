<script lang="ts">
	import { formatDate } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';

	let {
		sessionTitle,
		sessionDate,
		qrDataUrl,
		shareUrl,
		linkCopied,
		onCopyLink
	}: {
		sessionTitle: string;
		sessionDate: string;
		qrDataUrl: string | null;
		shareUrl: string;
		linkCopied: boolean;
		onCopyLink: () => void;
	} = $props();
</script>

<div class="max-w-sm mx-auto space-y-6 text-center">
	<div>
		<h2 class="text-xl font-semibold text-ink">{sessionTitle}</h2>
		<p class="text-sm text-on-surface-variant">{formatDate(sessionDate)}</p>
	</div>

	{#if qrDataUrl}
		<div class="flex justify-center rounded-2xl bg-surface-container-lowest p-4 border border-border">
			<img src={qrDataUrl} alt="QR code for share link" class="w-60 h-60" />
		</div>
	{:else if qrDataUrl === null}
		<div class="flex justify-center rounded-2xl bg-surface-container-lowest p-4 border border-border">
			<div class="w-60 h-60 flex items-center justify-center text-on-surface-variant">
				Loading QR...
			</div>
		</div>
	{:else}
		<div class="flex justify-center rounded-2xl bg-surface-container-lowest p-4 border border-border">
			<div class="w-60 h-60 flex items-center justify-center text-on-surface-variant">
				QR generation failed
			</div>
		</div>
	{/if}

	<div class="rounded-xl bg-surface-container-lowest p-4 border border-border">
		<p class="text-xs text-on-surface-variant mb-2">{m.share_link()}</p>
		<p class="text-sm font-mono text-ink break-all">{shareUrl}</p>
	</div>

	<Button class="w-full" onclick={onCopyLink}>
		{linkCopied ? m.copied_to_clipboard() : m.copy_text_btn()}
	</Button >
</div>
