<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
	import { formatCurrency, formatDate } from '$lib';
  import { sessionStorage } from '$lib/stores/storage.svelte';

	let estimatedCost = $derived(() => {
		if (!sessionStorage.courtBlocks?.length) return 0;
		const block = sessionStorage.courtBlocks[0];
		const hours = parseInt(block.endTime.split(':')[0]) - parseInt(block.startTime.split(':')[0]);
		return block.pricePerHour * hours;
	});
</script>


<section
	class="bg-surface-container-lowest p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-outline-variant/30"
>
	<div class="flex justify-between items-start mb-2 w-full">
		<div class="flex flex-1 items-center justify-between gap-3">
			<p class="text-xl font-semibold text-outline">{m.total_cost()}</p>
			<h2 class="text-2xl font-mono font-extrabold text-primary-container">{formatCurrency(estimatedCost())}</h2>
		</div>
	</div>
	<div class="flex gap-4">
		<div class="flex flex-1 items-center justify-between gap-3">
			<p class="text-sm text-outline">{m.session_date_label()}</p>
			<p class="text-sm">{formatDate(sessionStorage.date)}</p>
		</div>
	</div>
</section>
