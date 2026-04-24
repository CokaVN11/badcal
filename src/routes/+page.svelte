<script lang="ts">
	import { goto } from '$app/navigation';
	import { IconPingPong, IconPlus } from '@tabler/icons-svelte-runes';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Form from '$lib/components/ui/form';
	import * as m from '$lib/paraglide/messages';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { sessionFormSchema } from '$lib/schemas/+page.schema';
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import type { SessionState } from '$lib';

	let {
		data
	}: {
		data: {
			form: SessionState;
			recentSessions: { id: string; sessionTitle: string; sessionDate: string }[];
		};
	} = $props();

	const form = superForm(data.form, {
		validators: zod4Client(sessionFormSchema),
		onSubmit: ({ cancel }) => {
			sessionStorage.title = $formData.title;
			sessionStorage.date = $formData.date;
			goto('/create');
			cancel();
		}
	});
	const { form: formData, enhance } = form;
</script>

<div class="min-h-dvh flex flex-col bg-neutral">
	<!-- Sticky Header -->
	<header class="sticky top-0 z-20 backdrop-blur-md border-b bg-white/85 border-border">
		<div class="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
			<div class="flex-1 flex items-center gap-2">
				<div
					class="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-primary-hover flex items-center justify-center shadow-sm"
				>
					<IconPingPong class="w-4 h-4 text-white" />
				</div>
				<span class="font-bold text-ink tracking-tight">BadCal</span>
			</div>
		</div>
	</header>

  <!-- Bootstrap form -->
	<section class="px-4 py-6 max-w-lg mx-auto w-full">
		<form method="POST" use:enhance class="px-6 py-4 space-y-4 w-full bg-surface rounded-lg">
      <div class="space-y-1 animate-fade-in-up">
        <h2 class="text-2xl font-bold text-ink">
          {m.home_heading()}
        </h2>
        <p class="text-ink-muted">
          {m.home_heading_desc()}
        </p>
      </div>

			<Form.Field {form} name="title">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label for="session-title" class="text-sm font-medium text-ink"
							>{m.session_title_label()}</Form.Label
						>
						<Input
							type="text"
							{...props}
							bind:value={$formData.title}
							placeholder="Friday night ping pong"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="date">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label for="session-date" class="text-sm font-medium text-ink"
							>{m.session_date_label()}</Form.Label
						>
						<Input type="datetime-local" {...props} bind:value={$formData.date} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

      <Form.Button class="w-full">
      <IconPlus />
        {m.home_cta()}
      </Form.Button>
		</form>
	</section>

	<!-- Recent -->
	<section class="px-4 pb-10 max-w-lg mx-auto w-full">
		<p
			class="text-xs font-bold text-ink-muted uppercase tracking-widest mb-3 animate-fade-in-up delay-5"
		>
			{m.recent()}
		</p>
		{#if data.recentSessions.length === 0}
			<p class="text-sm text-muted-foreground">{m.no_recent_sessions()}</p>
		{:else}
			{#each data.recentSessions as session, i (session.id)}
				<Button
					href="/s/{session.id}"
					variant="ghost"
					class="w-full justify-start p-4 h-auto rounded-2xl border border-border bg-white hover:border-primary-soft-strong hover:shadow-sm active:scale-[0.99] transition-all animate-fade-in-up"
					style="animation-delay: {(i + 5) * 50}ms"
				>
					<div class="flex items-center justify-between w-full">
						<div>
							<p class="font-semibold text-ink text-sm text-left">{session.sessionTitle}</p>
							<p class="text-xs text-muted-foreground mt-0.5">{session.sessionDate}</p>
						</div>
					</div>
				</Button>
			{/each}
		{/if}
	</section>
</div>
