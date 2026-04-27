<script lang="ts">
	import { IconPlus, IconTrash, IconUsersGroup } from '@tabler/icons-svelte-runes';
	import PlayerGroupCard from './PlayerGroupCard.svelte';
	import type { Group } from '$lib/types';
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';

	let {
		groups,
		onAddGroup,
		onRemoveGroup,
		onBulkAdd,
		onRemovePlayer,
		onUpdateGroup
	}: {
		groups: Group[];
		onAddGroup: () => void;
		onRemoveGroup: (id: string) => void;
		onBulkAdd: (groupId: string, names: string[]) => void;
		onRemovePlayer: (groupId: string, nameIndex: number) => void;
		onUpdateGroup: (id: string, updates: Partial<Pick<Group, 'startTime' | 'endTime'>>) => void;
	} = $props();
</script>

<section
	class="bg-surface-container-lowest rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.04)] p-4 flex flex-col space-y-4"
>
	<div class="flex items-center space-x-2 border-b border-surface-container">
		<IconUsersGroup class="text-primary-container" />
		<h2 class="font-semibold text-xl text-on-background">{m.player()}</h2>
	</div>

	<div class="flex flex-col gap-2">
		{#each groups as group, gi (group.id)}
			<div class="flex items-center justify-between min-w-full relative">
				{#if groups.length > 1}
					<Button
						size="icon"
						variant="link"
						onclick={() => onRemoveGroup(group.id)}
						class="z-10 bg-accent size-8! text-error hover:text-error/80 transition-colors p-0.5 absolute top-0 right-0 rounded-full translate-x-1/2 "
					>
						<IconTrash class="h-4 w-4" />
					</Button>
				{/if}
			</div>
			<PlayerGroupCard
				{group}
				index={gi}
				onRemovePlayer={(ni) => onRemovePlayer(group.id, ni)}
				onBulkAdd={(names) => onBulkAdd(group.id, names)}
				{onUpdateGroup}
			/>
		{/each}
	</div>
	<!-- Add Group Button -->
	<Button variant="outline" onclick={onAddGroup} class="w-full">
		<IconPlus class="h-4 w-4" />
		{m.add_block()}
	</Button>
</section>
