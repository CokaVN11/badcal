<script lang="ts">
	import { formatCurrency } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages';

	let {
		shareResults,
		playerPaidMap,
		onTogglePaid
	}: {
		shareResults: { entryId: string; name: string; ratio: number; total: number; playerMinutes: number; courtShare: number; extraShare: number }[];
		playerPaidMap: Map<string, boolean>;
		onTogglePaid: (entryId: string) => void;
	} = $props();
</script>

<div class="max-w-md mx-auto space-y-4">
	{#each shareResults as r (r.entryId)}
		{@const isPaid = playerPaidMap.get(r.entryId) ?? false}
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
							{Math.round(r.ratio * 100)}% — {r.playerMinutes}{m.minutes_unit()}
						</p>
					</div>
				</div>
				<Button
          variant={isPaid ? 'default' : 'outline'}
					class="btn h-10 min-w-24"
					onclick={() => onTogglePaid(r.entryId)}
				>
					{isPaid ? m.paid() : m.unpaid()}
				</Button>
			</div>
			<div class="h-2 bg-surface-container rounded-full overflow-hidden mb-2">
				<div
					class="h-full bg-primary rounded-full transition-all duration-300"
					style="width: {r.ratio * 100}%"
				></div>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-on-surface-variant">{m.court_fee()} ({m.hours_unit()})</span>
				<span class="text-ink font-medium">{formatCurrency(r.courtShare)}</span>
			</div>
			{#if r.extraShare > 0}
				<div class="flex justify-between text-sm mt-1">
					<span class="text-on-surface-variant">{m.additional_costs()}</span>
					<span class="text-ink font-medium">{formatCurrency(r.extraShare)}</span>
				</div>
			{/if}
			<div class="flex justify-between text-sm mt-2 pt-2 border-t border-border">
				<span class="font-semibold text-ink">{m.total_cost()}</span>
				<span class="font-bold text-ink">{formatCurrency(r.total)}</span>
			</div>
		</div>
	{/each}
</div>
