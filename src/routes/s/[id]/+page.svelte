<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { saveSession } from '$lib/utils/persistence';
	import { computeTotals, computePlayerShares } from '$lib/utils/share-calc';
	import { togglePaid } from '$lib/api/sharing';
	import BillPreview from '$lib/components/BillPreview.svelte';
	import type { Player, AdditionalCost } from '$lib/types';

	type Props = {
		data: {
			session: {
				id: string;
				data: {
					sessionTitle: string;
					sessionDate: string;
					startTime: string | null;
					courtHours: number;
					courtPrice: number;
					shuttlecockPrice: number;
					shuttlecockCount: number;
					additionalCosts: Array<{ label: string; amount: number }>;
					players: Array<{
						id: number;
						name: string;
						hours: number;
						arrivalOffsetMinutes: number;
					}>;
				};
			};
			paidPlayerIds: number[];
		};
	};

	let { data }: Props = $props();

	let selectedPlayerId = $state<number | null>(null);
	let pendingToggle = $state<number | null>(null);

	// Reactive refs to session data
	let session = $derived(data.session);
	let payload = $derived(session.data);

	// Compute shares and totals from server-loaded payload
	let playerShares = $derived(
		computePlayerShares(
			payload.players as Player[],
			payload.courtPrice,
			payload.shuttlecockPrice,
			payload.shuttlecockCount,
			payload.additionalCosts
		)
	);

	let { totalCost } = $derived(computeTotals(payload.courtPrice, payload.shuttlecockPrice, payload.shuttlecockCount, payload.additionalCosts));

	// Local paid set initialized from server
	let localPaidIds = $state(new Set<number>(untrack(() => data.paidPlayerIds)));

	// Whether the selected player is marked paid
	let selfPaid = $derived(selectedPlayerId !== null && localPaidIds.has(selectedPlayerId));

	// Settlement summary
	let paidCount = $derived(localPaidIds.size);
	let allPaid = $derived(playerShares.length > 0 && paidCount === playerShares.length);
	let remainingAmount = $derived(
		playerShares
			.filter((p) => !localPaidIds.has(p.id))
			.reduce((sum, p) => sum + (p.share ?? 0), 0)
	);

	async function handleTogglePaid() {
		if (selectedPlayerId === null) return;
		const newPaid = !selfPaid;
		// Optimistic update
		if (newPaid) {
			localPaidIds.add(selectedPlayerId);
		} else {
			localPaidIds.delete(selectedPlayerId);
		}
		pendingToggle = selectedPlayerId;
		try {
			await togglePaid(session.id, selectedPlayerId, newPaid);
		} catch {
			// Revert on failure
			if (newPaid) {
				localPaidIds.delete(selectedPlayerId);
			} else {
				localPaidIds.add(selectedPlayerId);
			}
		} finally {
			pendingToggle = null;
		}
	}

	function handleFork() {
		saveSession({
			sessionTitle: payload.sessionTitle,
			sessionDate: payload.sessionDate,
			startTime: payload.startTime,
			courtHours: payload.courtHours,
			courtPrice: payload.courtPrice,
			shuttlecockPrice: payload.shuttlecockPrice,
			shuttlecockCount: payload.shuttlecockCount,
			additionalCosts: payload.additionalCosts.map((c, i) => ({ id: i, label: c.label, amount: c.amount })),
			players: payload.players,
		});
		goto('/');
	}
</script>

<div class="min-h-dvh flex flex-col bg-(--surface-muted)">
	<header class="backdrop-blur-md border-b px-4 py-2 sticky top-0 z-30 bg-white/90 border-(--border)">
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<h1 class="text-lg font-semibold flex-1 text-(--ink)">Shared Bill</h1>
		</div>
	</header>

	<main class="flex-1 p-4 pb-28">
		<div class="max-w-md mx-auto">
			<BillPreview
				sessionTitle={payload.sessionTitle}
				sessionDate={payload.sessionDate}
				startTime={payload.startTime}
				courtPrice={payload.courtPrice}
				shuttlecockPrice={payload.shuttlecockPrice}
				shuttlecockCount={payload.shuttlecockCount}
				additionalCosts={payload.additionalCosts as AdditionalCost[]}
				{playerShares}
				{totalCost}
				onBack={() => {}}
			/>

			<!-- Self-identification + payment toggle -->
			<div class="mt-4 rounded-2xl bg-white shadow-sm border border-(--border) overflow-hidden">
				<div class="px-4 py-3 border-b border-(--border)">
					<span class="text-sm font-semibold text-(--ink)">Who are you?</span>
				</div>
				<div class="p-4 space-y-3">
					<select
						class="w-full select select-bordered"
						bind:value={selectedPlayerId}
						aria-label="Select your name"
					>
						<option value={null}>— Choose player —</option>
						{#each payload.players as player (player.id)}
							<option value={player.id}>{player.name?.trim() || `Player ${payload.players.indexOf(player) + 1}`}</option>
						{/each}
					</select>

					{#if selectedPlayerId !== null}
						<button
							class="btn w-full h-12"
							class:btn-success={!selfPaid}
							class:btn-warning={selfPaid}
							onclick={handleTogglePaid}
							disabled={pendingToggle !== null}
						>
							{#if selfPaid}Mark as Unpaid{:else}Mark as Paid{/if}
						</button>
					{/if}
				</div>
			</div>

			<!-- Fork to editor -->
			<div class="mt-4">
				<button class="btn btn-outline w-full h-12" onclick={handleFork}>
					Edit a copy
				</button>
			</div>
		</div>
	</main>
</div>
