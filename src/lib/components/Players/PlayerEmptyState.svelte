<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { IconUsersGroup } from '@tabler/icons-svelte-runes';
</script>

<div class="text-center py-8 text-(--slate-400)">
	<IconUsersGroup class="mx-auto mb-4 w-12 h-12" />
	<p class="text-sm">{m.no_players_yet()}</p>
	<p class="text-xs mt-1">{m.add_players_hint()}</p>
</div>
