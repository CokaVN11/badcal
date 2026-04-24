<script lang="ts">
	import { computeCourtTotal } from '$lib/utils/share-calc';
	import { formatCurrency } from '$lib/utils/format';
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import * as m from '$lib/paraglide/messages';
	import { IconReceiptFilled } from '@tabler/icons-svelte-runes';

	const courtTotal = $derived(computeCourtTotal(sessionStorage.courtBlocks));
	const extraTotal = $derived(sessionStorage.extraCosts.reduce((s, c) => s + (c.amount || 0), 0));
	const grandTotal = $derived(courtTotal + extraTotal);
</script>

<section class="bg-surface-container-lowest rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.04)] p-4 flex flex-col space-y-4">
	<div class="flex items-center space-x-2 border-b border-surface-container">
		<IconReceiptFilled class="text-primary-container" />
		<h2 class="font-semibold text-xl text-on-background">{m.summary_heading()}</h2>
	</div>

	<div class="space-y-3">
		<div class="flex justify-between items-center">
			<span class="font-label-md text-outline">{m.court_fee()}</span>
			<span class="font-h2 text-h2 text-on-background">{formatCurrency(courtTotal)}</span>
		</div>
		<div class="flex justify-between items-center">
			<span class="font-label-md text-outline">{m.additional_costs()}</span>
			<span class="font-h3 text-h3 text-on-background">{formatCurrency(extraTotal)}</span>
		</div>
		<div class="border-t border-surface-container pt-4 flex justify-between items-center">
			<span class="font-h3 text-h3 text-on-background font-semibold">{m.total_cost()}</span>
			<span class="font-h2 text-h2 text-primary-container font-bold">{formatCurrency(grandTotal)}</span>
		</div>
	</div>
</section>
