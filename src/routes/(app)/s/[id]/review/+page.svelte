<script lang="ts">
	import type { PageData } from './$types';
	import * as m from '$lib/paraglide/messages';
	import {
		computeCourtTotal,
		computeShares,
		listPlayerOccurrences,
		parseTime
	} from '$lib/utils/share-calc';
	import { Button } from '$lib/components/ui/button';
	import { IconArrowLeft } from '@tabler/icons-svelte-runes';
	import { formatCurrency, formatDate } from '$lib';

	let { data }: { data: PageData } = $props();

	const playerShares = $derived(
		computeShares(data.session.groups, data.session.courtBlocks, data.session.extraCosts)
	);
	const courtTotal = $derived(computeCourtTotal(data.session.courtBlocks));
	const extraTotal = $derived(data.session.extraCosts.reduce((s, c) => s + (c.amount || 0), 0));
	const playerOccurrences = $derived(listPlayerOccurrences(data.session.groups));
	const groupByEntryId = $derived(
		new Map(
			playerOccurrences.map((occurrence) => [
				occurrence.entryId,
				data.session.groups.find((group) => group.id === occurrence.groupId)
			])
		)
	);
</script>

<header
	class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.04)]"
>
	<div class="flex items-center gap-3">
		<Button
			size="icon"
			variant="ghost"
			aria-label="Go back"
			class="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors"
			href={`/s/${data.session.id}`}
		>
			<IconArrowLeft size={16} class="text-on-surface" />
		</Button>
		<div class="flex flex-col">
			<h1 class="text-on-surface text-xl font-semibold">{m.breakdown()}</h1>
			<!-- <span class="font-label-md text-label-md text-outline">Bước 1/3</span> -->
		</div>
	</div>
</header>

<div class="min-h-dvh pb-24 px-6 pt-20 max-w-2xl mx-auto w-full gap-6 flex flex-col bg-surface-muted">
	<div class="space-y-4">
		<!-- Session header -->
		<div class="rounded-xl bg-white shadow-sm border border-border p-4">
			<h2 class="font-semibold text-ink">{data.session.sessionTitle}</h2>
			<p class="text-sm text-ink-muted">{formatDate(data.session.sessionDate)}</p>
		</div>

		<!-- Court costs by block -->
		<div class="rounded-xl bg-white shadow-sm border border-border p-4">
			<h3 class="text-sm font-semibold mb-2">{m.court_hours()}</h3>
			{#each data.session.courtBlocks as block (block.id)}
				{@const hours = (parseTime(block.endTime) - parseTime(block.startTime)) / 60}
				{@const blockCost = hours * block.courtCount * block.pricePerHour}
				<div class="flex justify-between text-sm">
					<span class="text-ink-muted"
						>{block.courtCount} court(s) · {block.startTime}–{block.endTime}</span
					>
					<span class="font-medium">{formatCurrency(blockCost)}</span>
				</div>
			{/each}
			<div class="border-t border-border mt-2 pt-2 flex justify-between font-semibold text-sm">
				<span>Court total</span>
				<span>{formatCurrency(courtTotal)}</span>
			</div>
		</div>

		<!-- Player shares -->
		<div class="rounded-xl bg-white shadow-sm border border-border p-4">
			<h3 class="text-sm font-semibold mb-3">{m.players_heading()}</h3>
			<div class="space-y-3">
				{#each playerShares as ps (ps.entryId)}
						{@const group = groupByEntryId.get(ps.entryId)}
					<div class="flex items-center justify-between">
						<div>
							<p class="font-medium text-ink">{ps.name}</p>
							<p class="text-xs text-ink-muted">
								{group?.startTime}–{group?.endTime}
								· {m.court_hours()}: {formatCurrency(ps.courtShare)}
								· {m.additional_costs()}: {formatCurrency(ps.extraShare)}đ
							</p>
						</div>
						<p class="font-semibold text-primary">{formatCurrency(ps.total)}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Grand total -->
		<div class="rounded-xl bg-white shadow-sm border border-border p-4">
			<div class="flex justify-between font-semibold">
				<span>{m.total_cost()}</span>
				<span class="text-primary">{formatCurrency(courtTotal + extraTotal)}</span>
			</div>
		</div>

		<!-- Share button -->
		<Button href={`/s/${data.session.id}`} class="w-full">
			{m.share_btn()}
		</Button>
	</div>
</div>
