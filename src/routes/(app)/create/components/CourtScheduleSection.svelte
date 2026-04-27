<script lang="ts">
	import { IconPlus, IconTrash, IconCalendar } from '@tabler/icons-svelte-runes';
	import { Button } from '$lib/components/ui/button';
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import * as m from '$lib/paraglide/messages';
	import CourtBlockRow from './CourtBlockRow.svelte';

	function addBlock() {
		sessionStorage.courtBlocks = [
			...sessionStorage.courtBlocks,
			{
				id: crypto.randomUUID(),
				courtCount: 1,
				startTime: '21:00',
				endTime: '22:00',
				pricePerHour: 110
			}
		];
	}

	function removeBlock(id: string) {
		sessionStorage.courtBlocks = sessionStorage.courtBlocks.filter((b) => b.id !== id);
	}

	const showMultiBlock = $derived(sessionStorage.courtBlocks.length > 1);
</script>

<section
	class="bg-surface-container-lowest rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.04)] p-4 flex flex-col space-y-4"
>
	<div class="flex items-center space-x-2 border-b border-surface-container">
		<IconCalendar class="text-primary-container" />
		<h2 class="font-semibold text-xl text-on-background">{m.court_hours()}</h2>
	</div>

	<div class="flex flex-col">
		{#if !showMultiBlock}
			<CourtBlockRow
				block={sessionStorage.courtBlocks[0]}
				onUpdate={(updated) => {
					sessionStorage.courtBlocks = sessionStorage.courtBlocks.map((b) =>
						b.id === updated.id ? updated : b
					);
				}}
			/>
		{:else}
			{#each sessionStorage.courtBlocks as block (block.id)}
				<div class="rounded-xl space-y-4">
					<div class="flex items-center justify-between min-w-full relative">
						{#if sessionStorage.courtBlocks.length > 1}
							<Button
								size="icon"
                variant="link"
								onclick={() => removeBlock(block.id)}
								class="bg-accent size-8! text-error hover:text-error/80 transition-colors p-0.5 absolute top-0 right-0 rounded-full translate-x-1/2 "
							>
								<IconTrash class="h-4 w-4" />
							</Button>
						{/if}
					</div>
					<CourtBlockRow
						block={block}
						onUpdate={(updated) => {
							sessionStorage.courtBlocks = sessionStorage.courtBlocks.map((b) =>
								b.id === updated.id ? updated : b
							);
						}}
					/>
				</div>
			{/each}
		{/if}
	</div>

	<Button variant="outline" onclick={addBlock} class="w-full">
		<IconPlus class="h-4 w-4" /> {m.add_block()}
	</Button>
</section>
