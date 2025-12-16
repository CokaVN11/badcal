<script lang="ts">
	// ABOUTME: First-time user onboarding flow with 3 coach marks
	// ABOUTME: Persists completion state to localStorage

	import { m } from '$lib/paraglide/messages.js';
	import CoachMark from './CoachMark.svelte';
	import { onMount } from 'svelte';

	const STORAGE_KEY = 'badcal_onboarding_complete';

	type Step = {
		title: () => string;
		description: () => string;
		targetSelector: string;
		position: 'top' | 'bottom' | 'left' | 'right';
	};

	let currentStep = $state(0);
	let isActive = $state(false);

	// Steps use functions to ensure i18n messages are reactive to language changes
	const steps: Step[] = [
		{
			title: () => m.onboarding_step1_title(),
			description: () => m.onboarding_step1_desc(),
			targetSelector: '.accordion-section:first-child',
			position: 'bottom'
		},
		{
			title: () => m.onboarding_step2_title(),
			description: () => m.onboarding_step2_desc(),
			targetSelector: '.accordion-section:nth-child(2)',
			position: 'bottom'
		},
		{
			title: () => m.onboarding_step3_title(),
			description: () => m.onboarding_step3_desc(),
			targetSelector: '.btn-primary',
			position: 'top'
		}
	];

	onMount(() => {
		const complete = localStorage.getItem(STORAGE_KEY);
		if (!complete) {
			// Delay slightly so layout renders first
			setTimeout(() => {
				isActive = true;
			}, 500);
		}
	});

	function handleNext() {
		if (currentStep < steps.length - 1) {
			currentStep++;
		} else {
			completeOnboarding();
		}
	}

	function handleSkip() {
		completeOnboarding();
	}

	function completeOnboarding() {
		isActive = false;
		localStorage.setItem(STORAGE_KEY, 'true');
	}

	let currentStepData = $derived(steps[currentStep]);
</script>

{#if isActive && currentStepData}
	<CoachMark
		title={currentStepData.title()}
		description={currentStepData.description()}
		step={currentStep + 1}
		totalSteps={steps.length}
		targetSelector={currentStepData.targetSelector}
		position={currentStepData.position}
		onNext={handleNext}
		onSkip={handleSkip}
	/>
{/if}
