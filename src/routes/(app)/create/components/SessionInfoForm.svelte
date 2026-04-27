<script lang="ts">
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import * as m from '$lib/paraglide/messages';
	import { Input } from '$lib/components/ui/input';
</script>

<section class="bg-surface-container-lowest rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.04)] p-4 flex flex-col space-y-4">
	<Input
		type="text"
		bind:value={sessionStorage.title}
		placeholder={m.session_title_placeholder()}
		class="w-full border-b border-surface-container pb-2 text-base font-semibold text-on-background placeholder:font-normal placeholder:text-outline focus:outline-none font-h"
	/>
	<Input
		type="datetime-local"
		bind:value={sessionStorage.date}
		class="w-full text-sm text-outline focus:outline-none"
	/>
</section>
