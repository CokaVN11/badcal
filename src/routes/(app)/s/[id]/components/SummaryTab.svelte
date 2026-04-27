<script lang="ts">
	import BillZaloPay from '$lib/components/bill/BillZaloPay.svelte';
	import type { Group, CourtBlock, ExtraCost } from '$lib/types';

	let {
		sessionTitle,
		sessionDate,
		startTime,
		courtPrice,
		shuttlecockPrice,
		shuttlecockCount,
		additionalCosts,
		totalCost,
		groups,
		courtBlocks,
		extraCosts,
		shareResults
	}: {
		sessionTitle: string;
		sessionDate: string;
		startTime: string | null;
		courtPrice: number;
		shuttlecockPrice: number;
		shuttlecockCount: number;
		additionalCosts: ExtraCost[];
		totalCost: number;
		groups: Group[];
		courtBlocks: CourtBlock[];
		extraCosts: ExtraCost[];
		shareResults?: { name: string; ratio: number; total: number; playerMinutes: number; courtShare: number; extraShare: number }[];
	} = $props();
</script>

<div class="max-w-md mx-auto">
	<BillZaloPay
		{sessionTitle}
		{sessionDate}
		{startTime}
		{courtPrice}
		{shuttlecockPrice}
		{shuttlecockCount}
		{additionalCosts}
		playerShares={[]}
		{totalCost}
		showNames={true}
		includeQR={false}
		{groups}
		{courtBlocks}
		{extraCosts}
		{shareResults}
	/>
</div>
