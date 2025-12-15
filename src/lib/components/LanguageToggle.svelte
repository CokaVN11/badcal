<script lang="ts">
	// ABOUTME: Language toggle dropdown for switching between en/vi/es using bits-ui DropdownMenu
	// ABOUTME: Uses Paraglide's setLocale which triggers a page reload

	import { DropdownMenu } from 'bits-ui';
	import { getLocale, setLocale, type Locale } from '$lib/paraglide/runtime';

	const languages = [
		{ code: 'en' as Locale, label: 'English', flag: '🇺🇸' },
		{ code: 'vi' as Locale, label: 'Tiếng Việt', flag: '🇻🇳' },
		{ code: 'es' as Locale, label: 'Español', flag: '🇪🇸' }
	];

	// Initialize with current locale and bind to RadioGroup
	let selectedLocale = $state<Locale>(getLocale());

	function getCurrentLanguage() {
		const locale = getLocale();
		return languages.find((l) => l.code === locale) || languages[0];
	}

	// Handle locale change from RadioGroup
	function handleLocaleChange(newLocale: string) {
		const locale = newLocale as Locale;
		if (locale !== getLocale()) {
			setLocale(locale);
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="btn-icon flex items-center gap-1.5 px-2">
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
			class="w-3 h-3 transition-transform data-[state=open]:rotate-180"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</DropdownMenu.Trigger>

	<DropdownMenu.Portal>
		<DropdownMenu.Content
			class="py-1 bg-white rounded-xl shadow-lg border border-(--border) min-w-[160px] z-50 animate-fade-in outline-none"
			sideOffset={4}
			align="end"
		>
			<DropdownMenu.RadioGroup bind:value={selectedLocale} onValueChange={handleLocaleChange}>
				{#each languages as lang (lang.code)}
					<DropdownMenu.RadioItem
						value={lang.code}
						class="w-full px-3 py-2 text-left text-sm flex items-center gap-2 outline-none cursor-pointer data-[highlighted]:bg-(--slate-50) transition-colors data-[state=checked]:bg-(--zp-blue-50) data-[state=checked]:text-(--zp-blue-700) text-(--ink-soft)"
					>
						{#snippet children({ checked })}
							<span class="text-base">{lang.flag}</span>
							<span class="flex-1">{lang.label}</span>
							{#if checked}
								<svg
									class="w-4 h-4 text-(--zp-blue-500)"
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
						{/snippet}
					</DropdownMenu.RadioItem>
				{/each}
			</DropdownMenu.RadioGroup>
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>
