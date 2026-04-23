<script lang="ts">
	import type { PageData } from './$types';
	import * as m from '$lib/paraglide/messages';

	let { data }: { data: PageData } = $props();

	// Flatten all player names from groups
	const allNames = $derived(data.session.groups.flatMap((g) => g.playerNames));

	// Minute-proportion court share (Phase 3 will update share-calc.ts)
	function parseTime(t: string): number {
		const [h, m2] = t.split(':').map(Number);
		return h * 60 + (m2 ?? 0);
	}

	const courtTotal = $derived(
		data.session.courtBlocks.reduce((sum, b) => {
			const hours = (parseTime(b.endTime) - parseTime(b.startTime)) / 60;
			return sum + hours * b.courtCount * b.pricePerHour;
		}, 0)
	);

	const extraTotal = $derived(
		data.session.extraCosts.reduce((s, c) => s + (c.amount || 0), 0)
	);

	// Per-group shares
	const groupShares = $derived(
		data.session.groups.map((g) => {
			const playerMinutes = g.playerNames.length * (parseTime(g.endTime) - parseTime(g.startTime));
			return { g, playerMinutes, playerCount: g.playerNames.length };
		})
	);

	const totalPlayerMinutes = $derived(
		groupShares.reduce((s, { playerMinutes }) => s + playerMinutes, 0)
	);

	const perPlayerExtra = $derived(
		allNames.length > 0 ? extraTotal / allNames.length : 0
	);

	const UNIT = 500;

	function roundToUnit(n: number): number {
		return Math.ceil(n / UNIT) * UNIT;
	}

	// Per-player final shares (minute-proportion + even extra split + LRM rounding)
	const playerShares = $derived.by(() => {
		if (totalPlayerMinutes === 0) return [];
		const roundedCourt = roundToUnit(courtTotal);
		const totalUnits = roundedCourt / UNIT;

		const withExact = allNames.map((name: string, idx: number) => {
			const group = data.session.groups.find((g) => g.playerNames.includes(name))!;
			const minutes = parseTime(group.endTime) - parseTime(group.startTime);
			const ratio = minutes / totalPlayerMinutes;
			const exactUnits = ratio * totalUnits;
			const floorUnits = Math.floor(exactUnits);
			return { name, idx, ratio, exactUnits, floorUnits, rem: exactUnits - floorUnits };
		});

		let unitsLeft = totalUnits - withExact.reduce((s, p) => s + p.floorUnits, 0);
		const sorted = [...withExact].sort((a, b) => b.rem - a.rem || a.idx - b.idx);

		const shares = new Map<number, number>();
		sorted.forEach((p, i) => {
			shares.set(p.idx, (p.floorUnits + (i < unitsLeft ? 1 : 0)) * UNIT);
		});

		return withExact.map((p) => ({
			name: p.name,
			courtShare: shares.get(p.idx) ?? 0,
			extraShare: perPlayerExtra,
			total: (shares.get(p.idx) ?? 0) + perPlayerExtra
		}));
	});
</script>

<div class="min-h-dvh flex flex-col bg-(--surface-muted)">
	<header class="backdrop-blur-md border-b px-4 py-2 sticky top-0 z-30 bg-white/90 border-(--border)">
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<a href={`/s/${data.session.id}`} class="text-(--ink-muted) hover:text-(--ink)">← Back</a>
			<h1 class="text-lg font-semibold flex-1 text-(--ink)">{m.breakdown()}</h1>
		</div>
	</header>

	<main class="flex-1 p-4 pb-28">
		<div class="max-w-md mx-auto space-y-4">
			<!-- Session header -->
			<div class="rounded-2xl bg-white shadow-sm border border-(--border) p-4">
				<h2 class="font-semibold text-(--ink)">{data.session.sessionTitle}</h2>
				<p class="text-sm text-(--ink-muted)">{data.session.sessionDate}</p>
			</div>

			<!-- Court costs by block -->
			<div class="rounded-2xl bg-white shadow-sm border border-(--border) p-4">
				<h3 class="text-sm font-semibold mb-2">{m.court_hours()}</h3>
				{#each data.session.courtBlocks as block}
					{@const hours = (parseTime(block.endTime) - parseTime(block.startTime)) / 60}
					{@const blockCost = hours * block.courtCount * block.pricePerHour}
					<div class="flex justify-between text-sm">
						<span class="text-(--ink-muted)">{block.courtCount} court(s) · {block.startTime}–{block.endTime}</span>
						<span class="font-medium">{blockCost.toLocaleString()}đ</span>
					</div>
				{/each}
				<div class="border-t border-(--border) mt-2 pt-2 flex justify-between font-semibold text-sm">
					<span>Court total</span>
					<span>{courtTotal.toLocaleString()}đ</span>
				</div>
			</div>

			<!-- Player shares -->
			<div class="rounded-2xl bg-white shadow-sm border border-(--border) p-4">
				<h3 class="text-sm font-semibold mb-3">{m.players_heading()}</h3>
				<div class="space-y-3">
					{#each playerShares as ps}
						<div class="flex items-center justify-between">
							<div>
								<p class="font-medium text-(--ink)">{ps.name}</p>
								<p class="text-xs text-(--ink-muted)">
									{m.court_hours()}: {ps.courtShare.toLocaleString()}đ · {m.additional_costs()}: {ps.extraShare.toLocaleString()}đ
								</p>
							</div>
							<p class="font-semibold text-(--primary)">{ps.total.toLocaleString()}đ</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Grand total -->
			<div class="rounded-2xl bg-white shadow-sm border border-(--border) p-4">
				<div class="flex justify-between font-semibold">
					<span>Grand total</span>
					<span class="text-(--primary)">{(courtTotal + extraTotal).toLocaleString()}đ</span>
				</div>
			</div>

			<!-- Share button -->
			<a href={`/s/${data.session.id}/share`} class="btn btn-primary w-full h-12">
				{m.share_btn()}
			</a>
		</div>
	</main>
</div>
