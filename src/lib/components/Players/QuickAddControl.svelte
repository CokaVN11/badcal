<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { MAX_QUICK_ADD, clampToIntegerRange } from '../Players/playerList.logic';
	type Props = {
		onAdd: (count: number) => void;
		max?: number;
	};

	let { onAdd, max = MAX_QUICK_ADD }: Props = $props();

	let rawCount = $state('');

	let clampedCount = $derived.by(() => clampToIntegerRange(rawCount, 0, max));

	let canAdd = $derived.by(() => clampedCount > 0 && clampedCount <= max);

	function handleSubmit() {
		if (!canAdd) return;
		onAdd(clampedCount);
		rawCount = '';
	}
</script>

<form
	class="flex items-center gap-2"
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
>
	<input
		id="quick-add-count"
		type="number"
		min="0"
		step="1"
		inputmode="numeric"
		placeholder={m.players_count_placeholder()}
		bind:value={rawCount}
		class="w-16 form-input form-input-number text-xs py-1.5 px-2"
	/>

	<button
		type="submit"
		class="btn-secondary py-1.5 px-3 tracking-tighter whitespace-nowrap disabled:opacity-50"
		disabled={!canAdd}
	>
		{m.add_n_players({ count: clampedCount })}
	</button>
</form>
