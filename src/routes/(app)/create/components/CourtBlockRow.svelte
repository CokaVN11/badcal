<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { parseTime } from '$lib/utils/share-calc';
	import * as m from '$lib/paraglide/messages';
	import { formatCurrency } from '$lib/utils/format';
	import type { CourtBlock } from '$lib/types';

	let {
		block,
		onUpdate
	}: {
		block: CourtBlock;
		onUpdate: (updated: CourtBlock) => void;
	} = $props();

	function update(partial: Partial<CourtBlock>) {
		onUpdate({ ...block, ...partial });
	}

	const durationMinutes = $derived(Math.max(0, parseTime(block.endTime) - parseTime(block.startTime)));
	const hours = $derived(durationMinutes / 60);
	const durationLabel = $derived(
		durationMinutes >= 60
			? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? ` ${durationMinutes % 60}p` : ''}`
			: `${durationMinutes} phút`
	);
	const totalFee = $derived(hours * block.courtCount * block.pricePerHour);
</script>

<div class="flex flex-col space-y-1 border border-surface-container rounded-xl p-4">
	<!-- Time row -->
	<div class="flex justify-between items-center">
		<div class="flex flex-col space-y-1">
			<span class="font-semibold text-xs text-outline uppercase tracking-wider"
				>{m.court_start_time()}</span
			>
			<Input
				type="time"
				value={block.startTime}
				oninput={(e) => update({ startTime: e.currentTarget.value })}
				class="font-bold text-2xl p-0 text-on-background bg-transparent border-none focus:outline-none w-full text-left no-clock"
			/>
		</div>
		<div class="flex flex-col items-center justify-center space-y-1">
			<span
				class="font-semibold text-lg text-primary-container bg-primary-fixed px-2 py-1 rounded-full"
			>
				{durationLabel}
			</span>
		</div>
		<div class="flex flex-col space-y-1 text-right">
			<span class="font-semibold text-xs text-outline uppercase tracking-wider"
				>{m.court_end_time()}</span
			>
			<Input
				type="time"
				value={block.endTime}
				oninput={(e) => update({ endTime: e.currentTarget.value })}
				class="font-bold text-2xl p-0 text-on-background bg-transparent border-none focus:outline-none w-full text-right no-clock"
			/>
		</div>
	</div>

  <div class="border-t border-surface-container"></div>

	<!-- Fee row -->
	<div class="flex justify-between items-center gap-4">
		<div class="flex flex-col space-y-1">
			<span class="font-semibold text-xs text-outline uppercase tracking-wider">{m.court_fee()}</span>
			<div class="flex items-center gap-1">
				<Input
					type="number"
					min="0"
					value={block.pricePerHour}
					oninput={(e) => update({ pricePerHour: Number(e.currentTarget.value) })}
					class="w-24 h-9 text-sm font-semibold text-on-background bg-surface-container border border-surface-container rounded-md px-3 py-1 text-right"
				/>
				<span class="text-sm text-outline font-semibold">/{m.hours_unit()}</span>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<div class="border-r border-dashed border-surface-container h-8"></div>
		</div>
		<div class="flex flex-col space-y-1 text-right">
			<span class="font-semibold text-xs text-outline uppercase tracking-wider">{m.court_price()}</span>
			<span class="font-h2 text-h2 text-primary-container font-bold"
				>{formatCurrency(totalFee)}</span
			>
		</div>
	</div>
</div>