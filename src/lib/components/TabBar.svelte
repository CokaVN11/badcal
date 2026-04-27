<script lang="ts">
	interface Props {
		tabs: string[];
		active?: number;
	}

	let { tabs, active = $bindable(0) }: Props = $props();
</script>

<div class="flex bg-surface-container rounded-xl p-1 gap-1">
	{#each tabs as tab, i}
		<button
			type="button"
			class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150"
			class:bg-surface-container-lowest={active === i}
			class:text-primary={active === i}
			class:font-semibold={active === i}
			class:bg-transparent={active !== i}
			class:text-on-surface-variant={active !== i}
			onclick={() => (active = i)}
		>
			{tab}
		</button>
	{/each}
</div>