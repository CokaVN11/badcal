<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { IconFileUpload, IconX } from '@tabler/icons-svelte-runes';
	import { Dialog } from 'bits-ui';

	type Props = {
		onImport: (rawText: string) => void;
	};

	let { onImport }: Props = $props();

	let open = $state(false);
	let text = $state('');

	let canSubmit = $derived.by(() => text.trim().length > 0);

	function submit() {
		if (!canSubmit) return;
		onImport(text.trim());
		open = false;
		text = '';
	}

	function onTextareaKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			submit();
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class="btn-secondary text-xs py-1.5 px-3" type="button">
		<IconFileUpload stroke={1.5} />
		{m.import_btn()}
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in" />
		<Dialog.Content
			class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl outline-none data-[state=open]:animate-fade-in"
		>
			<div class="p-4 border-b border-(--slate-200)">
				<div class="flex items-center justify-between">
					<Dialog.Title class="text-lg font-semibold text-(--slate-800)">
						{m.import_players_title()}
					</Dialog.Title>
					<Dialog.Close class="btn-icon" type="button" aria-label={m.cancel()}>
						<IconX stroke={2} />
					</Dialog.Close>
				</div>
				<Dialog.Description class="text-sm text-(--slate-500) mt-1">
					{m.import_players_hint()}
				</Dialog.Description>
			</div>

			<div class="p-4">
				<textarea
					bind:value={text}
					onkeydown={onTextareaKeydown}
					placeholder={m.import_placeholder()}
					rows="8"
					class="form-input resize-none font-mono text-sm"
				></textarea>
			</div>

			<div class="p-4 border-t border-(--slate-200) flex gap-3">
				<Dialog.Close class="btn-secondary flex-1" type="button">{m.cancel()}</Dialog.Close>

				<button class="btn-primary flex-1" type="button" onclick={submit} disabled={!canSubmit}>
					{m.import_btn()}
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
