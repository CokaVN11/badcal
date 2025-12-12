<script lang="ts">
	// ABOUTME: Language toggle dropdown for switching between en/vi/es
	// ABOUTME: Uses Paraglide's setLocale which triggers a page reload

	import { getLocale, setLocale, type Locale } from '$lib/paraglide/runtime';

	let isOpen = $state(false);

	const languages = [
		{ code: 'en' as Locale, label: 'English', flag: '🇺🇸' },
		{ code: 'vi' as Locale, label: 'Tiếng Việt', flag: '🇻🇳' },
		{ code: 'es' as Locale, label: 'Español', flag: '🇪🇸' }
	];

	function getCurrentLanguage() {
		const locale = getLocale();
		return languages.find((l) => l.code === locale) || languages[0];
	}

	function selectLanguage(code: Locale) {
		if (code !== getLocale()) {
			setLocale(code);
		}
		isOpen = false;
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	function handleClickOutside() {
		if (isOpen) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative">
	<button
		class="btn-icon flex items-center gap-1.5 px-2"
		onclick={(e) => {
			e.stopPropagation();
			toggleDropdown();
		}}
		aria-haspopup="menu"
		aria-expanded={isOpen}
		aria-label="Select language"
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
			/>
		</svg>
		<span class="text-xs font-semibold uppercase">{getCurrentLanguage().code}</span>
		<svg
			class="w-3 h-3 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 top-full mt-1 py-1 bg-white rounded-lg shadow-lg border border-(--slate-200) min-w-[140px] z-50 animate-fade-in"
			role="menu"
		>
			{#each languages as lang (lang.code)}
				{@const isActive = lang.code === getLocale()}
				<button
					class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-(--slate-50) transition-colors {isActive
						? 'bg-(--court-50) text-(--court-700)'
						: 'text-(--slate-700)'}"
					role="menuitem"
					onclick={() => selectLanguage(lang.code)}
				>
					<span class="text-base">{lang.flag}</span>
					<span class="flex-1">{lang.label}</span>
					{#if isActive}
						<svg
							class="w-4 h-4 text-(--court-500)"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
