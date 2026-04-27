<script lang="ts">
	import { getContext } from 'svelte';
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import * as m from '$lib/paraglide/messages';
	import { parseTime } from '$lib/utils/share-calc';
	import SessionInfoForm from './components/SessionInfoForm.svelte';
	import CourtScheduleSection from './components/CourtScheduleSection.svelte';
	import ExtraCostsSection from './components/ExtraCostsSection.svelte';
	import CostSummary from './components/CostSummary.svelte';
	import { Button } from '$lib/components/ui/button';
	import { IconArrowLeft } from '@tabler/icons-svelte-runes';

	const setReady = getContext<{ setReady: (v: boolean) => void }>('layout').setReady;

	if ((sessionStorage.courtBlocks?.length ?? 0) === 0) {
		sessionStorage.courtBlocks = [
			{
				id: crypto.randomUUID(),
				courtCount: 1,
				startTime: '19:00',
				endTime: '21:00',
				pricePerHour: 110
			}
		];
	}
	if ((sessionStorage.extraCosts?.length ?? 0) === 0) {
		sessionStorage.extraCosts = [{ id: crypto.randomUUID(), label: 'Shuttlecock', amount: 0 }];
	}

	const isValid = $derived(
		(sessionStorage.title ?? '').trim().length > 0 &&
			(sessionStorage.date ?? '').length > 0 &&
			sessionStorage.courtBlocks.length > 0 &&
			sessionStorage.courtBlocks.every(
				(b) =>
					b.courtCount >= 1 && parseTime(b.startTime) < parseTime(b.endTime) && b.pricePerHour > 0
			)
	);

	$effect(() => {
		setReady(isValid);
	});
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
      onclick={() => history.back()}
		>
			<IconArrowLeft size={16} class="text-on-surface"/>
		</Button>
		<div class="flex flex-col">
			<h1 class="text-on-surface text-xl font-semibold">{m.onboarding_step1_title()}</h1>
			<!-- <span class="font-label-md text-label-md text-outline">Bước 1/3</span> -->
		</div>
	</div>
</header>

<div class="pb-24 px-6 pt-20 max-w-2xl mx-auto w-full gap-6 flex flex-col">
	<SessionInfoForm />
	<CourtScheduleSection />
	<ExtraCostsSection />
	<CostSummary />
</div>
