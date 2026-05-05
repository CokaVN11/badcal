<script lang="ts">
	import { setContext } from 'svelte';

	let { children } = $props();

	// ready signal set by child pages via context
	let ready = $state(false);

	let saving = $state(false);

	function setSaving(v: boolean) { saving = v; }

	function setReady(value: boolean) {
		ready = value;
	}

	// Provide layout context to child pages
	setContext('layout', { setReady, saving, setSaving });

</script>

<div class="min-h-dvh flex flex-col bg-surface-container-high">
	{@render children()}
</div>
