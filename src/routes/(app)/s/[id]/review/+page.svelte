<script lang="ts">
	import type { PageData } from './$types';
	import * as m from '$lib/paraglide/messages';
	import { computeMinuteProportionShares, computeCourtTotal, parseTime } from '$lib/utils/share-calc';

	let { data }: { data: PageData } = $props();

	const playerShares = $derived(
		computeMinuteProportionShares(data.session.groups, data.session.courtBlocks, data.session.extraCosts)
	);
	const courtTotal = $derived(computeCourtTotal(data.session.courtBlocks));
	const extraTotal = $derived(
		data.session.extraCosts.reduce((s, c) => s + (c.amount || 0), 0)
	);
</script>

<div class="min-h-dvh flex flex-col bg-surface-muted">
	<header class="backdrop-blur-md border-b px-4 py-2 sticky top-0 z-30 bg-white/90 border-border">
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<a href={`/s/${data.session.id}`} class="text-ink-muted hover:text-ink">← Back</a>
			<h1 class="text-lg font-semibold flex-1 text-ink">{m.breakdown()}</h1>
		</div>
	</header>

	<main class="flex-1 p-4 pb-28">
		<div class="max-w-md mx-auto space-y-4">
			<!-- Session header -->
			<div class="rounded-2xl bg-white shadow-sm border border-border p-4">
				<h2 class="font-semibold text-ink">{data.session.sessionTitle}</h2>
				<p class="text-sm text-ink-muted">{data.session.sessionDate}</p>
			</div>

			<!-- Court costs by block -->
			<div class="rounded-2xl bg-white shadow-sm border border-border p-4">
				<h3 class="text-sm font-semibold mb-2">{m.court_hours()}</h3>
				{#each data.session.courtBlocks as block}
					{@const hours = (parseTime(block.endTime) - parseTime(block.startTime)) / 60}
					{@const blockCost = hours * block.courtCount * block.pricePerHour}
					<div class="flex justify-between text-sm">
						<span class="text-ink-muted">{block.courtCount} court(s) · {block.startTime}–{block.endTime}</span>
						<span class="font-medium">{blockCost.toLocaleString()}đ</span>
					</div>
				{/each}
				<div class="border-t border-border mt-2 pt-2 flex justify-between font-semibold text-sm">
					<span>Court total</span>
					<span>{courtTotal.toLocaleString()}đ</span>
				</div>
			</div>

			<!-- Player shares -->
			<div class="rounded-2xl bg-white shadow-sm border border-border p-4">
				<h3 class="text-sm font-semibold mb-3">{m.players_heading()}</h3>
				<div class="space-y-3">
					{#each playerShares as ps}
						<div class="flex items-center justify-between">
							<div>
								<p class="font-medium text-ink">{ps.name}</p>
								<p class="text-xs text-ink-muted">
									{m.court_hours()}: {ps.courtShare.toLocaleString()}đ · {m.additional_costs()}: {ps.extraShare.toLocaleString()}đ
								</p>
							</div>
							<p class="font-semibold text-primary">{ps.total.toLocaleString()}đ</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Grand total -->
			<div class="rounded-2xl bg-white shadow-sm border border-border p-4">
				<div class="flex justify-between font-semibold">
					<span>Grand total</span>
					<span class="text-primary">{(courtTotal + extraTotal).toLocaleString()}đ</span>
				</div>
			</div>

			<!-- Share button -->
			<a href={`/s/${data.session.id}/share`} class="btn btn-primary w-full h-12">
				{m.share_btn()}
			</a>
		</div>
	</main>
</div>
