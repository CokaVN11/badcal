<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { IconUsersGroup, IconArrowUp } from '@tabler/icons-svelte-runes';
	import { Empty } from '$lib/components/ui/empty';
</script>

<Empty>
	<div class="mb-3">
		<IconUsersGroup class="w-8 h-8 text-primary mx-auto" />
	</div>
	<p class="font-semibold text-foreground">{m.no_players_yet()}</p>
	<p class="text-sm text-muted-foreground">{m.add_players_hint()}</p>
	<div class="flex items-center justify-center gap-1 mt-3 text-xs text-primary animate-bounce">
		<IconArrowUp class="w-4 h-4" />
		<span>{m.quick_add()}</span>
	</div>
</Empty>
