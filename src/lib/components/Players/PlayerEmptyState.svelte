<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { IconUsersGroup, IconArrowUp } from '@tabler/icons-svelte-runes';
</script>

<div class="empty-state">
	<div class="empty-state-icon">
		<IconUsersGroup class="w-8 h-8 text-(--zp-blue-500)" />
	</div>
	<p class="empty-state-title">{m.no_players_yet()}</p>
	<p class="empty-state-hint">{m.add_players_hint()}</p>
	<div
		class="flex items-center justify-center gap-1 mt-3 text-xs text-(--zp-blue-500) animate-bounce"
	>
		<IconArrowUp class="w-4 h-4" />
		<span>{m.quick_add()}</span>
	</div>
</div>
