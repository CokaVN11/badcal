<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import * as m from '$lib/paraglide/messages';
	import {
		IconArrowLeft,
		IconDotsVertical,
		IconPingPong,
		IconUsers,
		IconStack2,
		IconChevronDown,
		IconChevronUp,
		IconPencil,
		IconCirclePlus,
		IconShare,
		IconArrowRight,
		IconBolt,
		IconCash,
		IconLayoutGrid,
		IconCalendar,
		IconWallet,
		IconUser,
		IconTrash,
		IconX
	} from '@tabler/icons-svelte-runes';
	import { toast } from 'svelte-sonner';
	import { createOrReuseSession } from '$lib/api/sharing';
	import type { CourtBlock, Group } from '$lib/types';

	const setReady = getContext<{ setReady: (v: boolean) => void }>('layout').setReady;

	onMount(() => {
		if ((sessionStorage.courtBlocks?.length ?? 0) === 0) {
			goto('/create');
		}
	});

	const DEFAULT_TIME_RANGE = { startTime: '19:00', endTime: '21:00' };

	let groups = $state<Group[]>(
		(sessionStorage.groups?.length ?? 0) > 0
			? [...sessionStorage.groups]
			: [{ id: crypto.randomUUID(), ...DEFAULT_TIME_RANGE, playerNames: [] }]
	);

	let expandedGroups = $state<Record<string, boolean>>({});
	let saving = $state(false);

	$effect(() => {
		sessionStorage.groups = groups;
	});

	let isValid = $derived(groups.some((g) => g.playerNames.length > 0));

	$effect(() => {
		setReady(isValid);
	});

	// Computed stats
	let totalPlayers = $derived(groups.reduce((sum, g) => sum + g.playerNames.length, 0));

	let totalHours = $derived(() => {
		if (!sessionStorage.courtBlocks?.length) return 0;
		const first = sessionStorage.courtBlocks[0];
		const start = parseInt(first.startTime.split(':')[0]);
		const end = parseInt(first.endTime.split(':')[0]);
		return end - start;
	});

	let estimatedCost = $derived(() => {
		if (!sessionStorage.courtBlocks?.length) return 0;
		const block = sessionStorage.courtBlocks[0];
		const hours = parseInt(block.endTime.split(':')[0]) - parseInt(block.startTime.split(':')[0]);
		return block.pricePerHour * hours;
	});

	function toggleGroup(id: string) {
		expandedGroups = { ...expandedGroups, [id]: !expandedGroups[id] };
	}

	function addGroup() {
		const newGroup = { id: crypto.randomUUID(), ...DEFAULT_TIME_RANGE, playerNames: [] };
		groups = [...groups, newGroup];
		expandedGroups = { ...expandedGroups, [newGroup.id]: true };
	}

	function removeGroup(id: string) {
		groups = groups.filter((g) => g.id !== id);
		if (groups.length === 0) {
			groups = [{ id: crypto.randomUUID(), ...DEFAULT_TIME_RANGE, playerNames: [] }];
		}
	}

	function addPlayerToGroup(groupId: string, name: string) {
		const trimmed = name.trim();
		if (!trimmed) return;
		groups = groups.map((g) =>
			g.id === groupId ? { ...g, playerNames: [...g.playerNames, trimmed] } : g
		);
	}

	function removePlayer(groupId: string, nameIndex: number) {
		groups = groups.map((g) =>
			g.id === groupId ? { ...g, playerNames: g.playerNames.filter((_, i) => i !== nameIndex) } : g
		);
	}

	function handleBulkPaste(groupId: string, event: Event) {
		const input = event.target as HTMLTextAreaElement;
		const names = input.value
			.split(/[\n,]+/)
			.map((n) => n.trim())
			.filter(Boolean);
		if (!names.length) return;
		groups = groups.map((g) =>
			g.id === groupId ? { ...g, playerNames: [...g.playerNames, ...names] } : g
		);
		input.value = '';
	}

	async function handleSaveAndShare() {
		if (!isValid || saving) return;
		saving = true;
		try {
			const payload = {
				title: sessionStorage.title,
				date: sessionStorage.date,
				courtBlocks: sessionStorage.courtBlocks.map((b) => ({
					courtCount: b.courtCount,
					startTime: b.startTime,
					endTime: b.endTime,
					pricePerHour: b.pricePerHour
				})) as CourtBlock[],
				groups: groups.map((g) => ({
					startTime: g.startTime,
					endTime: g.endTime,
					playerNames: g.playerNames
				})) as Group[],
				extraCosts: sessionStorage.extraCosts.map((c) => ({ label: c.label, amount: c.amount }))
			};

			const result = await createOrReuseSession(payload);
			await goto(`/s/${result.id}`);
		} catch {
			toast.error('Failed to create session');
		} finally {
			saving = false;
		}
	}

	function formatTime(time: string): string {
		const [h, m] = time.split(':');
		return `${h}:${m}`;
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
	}
</script>

<div class="pb-32">
	<!-- Sticky Header -->
	<header class="sticky top-0 z-50 bg-white border-b border-border shadow-xs flex items-center justify-between px-4 h-16 w-full">
		<div class="flex items-center gap-3">
			<button
				onclick={() => goto('/create')}
				class="flex items-center justify-center h-10 w-10 rounded-full hover:bg-neutral transition-all active:scale-95"
			>
				<IconArrowLeft class="h-5 w-5 text-primary" />
			</button>
			<h1 class="font-display! font-bold text-lg tracking-tight text-ink">
				{m.onboarding_step2_title()}
			</h1>
		</div>
		<button class="flex items-center justify-center h-10 w-10 rounded-full hover:bg-neutral transition-all active:scale-95">
			<IconDotsVertical class="h-5 w-5 text-ink-soft" />
		</button>
	</header>

	<main class="max-w-md mx-auto px-4 pt-6">
		<!-- Asset Overview Section -->
		<section class="mb-6">
			<div class="flex items-center justify-between mb-3">
				<div class="flex items-center gap-3">
					<div class="h-10 w-10 rounded-full bg-primary-soft flex items-center justify-center">
						<IconPingPong class="h-5 w-5 text-primary" />
					</div>
					<div>
						<p class="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
							{sessionStorage.title || 'Session'}
						</p>
						<p class="font-display! font-semibold text-base text-ink">
							{formatDate(sessionStorage.date)}
						</p>
					</div>
				</div>
				<span class="bg-secondary-soft text-secondary px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
					ĐANG CHỜ
				</span>
			</div>

			<!-- Cost Summary Card -->
			<div class="bg-white rounded-xl p-4 shadow-card border border-border">
				<div class="flex justify-between items-center pb-4 border-b border-neutral mb-4">
					<div>
						<p class="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Tổng thời gian</p>
						<p class="font-display! font-bold text-2xl text-primary">
							{totalHours()} <span class="text-sm font-normal text-ink-muted">giờ</span>
						</p>
					</div>
					<div class="text-right">
						<p class="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Dự kiến chi phí</p>
						<p class="font-display! font-bold text-2xl text-ink">
							{formatCurrency(estimatedCost())}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-3">
					<div class="flex -space-x-2">
						{#if totalPlayers > 0}
							{#each Array(Math.min(3, totalPlayers)) as _, i (i)}
								<div class="w-8 h-8 rounded-full border-2 border-white bg-primary-soft flex items-center justify-center text-[10px] font-bold text-primary">
									{i + 1}
								</div>
							{/each}
							{#if totalPlayers > 3}
								<div class="w-8 h-8 rounded-full border-2 border-white bg-neutral flex items-center justify-center text-[10px] font-bold text-ink-muted">
									+{totalPlayers - 3}
								</div>
							{/if}
						{/if}
					</div>
					<p class="text-sm text-ink-muted">{totalPlayers} người đã đăng ký</p>
				</div>
			</div>
		</section>

		<!-- Expanded Players Section -->
		<section class="mb-6">
			<div class="flex items-center justify-between mb-3">
				<h2 class="font-display! font-semibold text-base text-ink">Người chơi</h2>
				<button class="text-primary font-semibold text-xs flex items-center gap-1 active:scale-95 transition-all">
					Chỉnh từng người
					<IconPencil class="h-4 w-4" />
				</button>
			</div>

			<div class="space-y-3">
				{#each groups as group, gi (group.id)}
					{@const isExpanded = expandedGroups[group.id]}
					{@const playerCount = group.playerNames.length}

					<div class="bg-white rounded-xl overflow-hidden shadow-card border border-border {isExpanded ? 'border-2 border-primary' : ''}">
						<!-- Group Header -->
						<button
							type="button"
							onclick={() => toggleGroup(group.id)}
							class="w-full p-4 flex items-center justify-between {isExpanded ? 'bg-primary-soft/20 border-b border-neutral' : ''}"
						>
							<div class="flex items-center gap-2">
								{#if isExpanded}
									<IconStack2 class="h-5 w-5 text-primary" />
								{:else}
									<IconUsers class="h-5 w-5 text-ink-soft" />
								{/if}
								<span class="font-semibold text-ink {isExpanded ? 'font-bold' : ''}">
									{isExpanded ? 'Nhóm ' + (gi + 1) + ' (Đã mở)' : 'Nhóm ' + (gi + 1)}
								</span>
								<span class="bg-neutral px-2 py-0.5 rounded text-[10px] font-semibold text-ink-muted">
									{formatTime(group.startTime)} - {formatTime(group.endTime)}
								</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-sm text-ink-muted {isExpanded ? 'font-semibold text-primary' : ''}">
									{playerCount} người
								</span>
								{#if isExpanded}
									<IconChevronUp class="h-5 w-5 text-primary" />
								{:else}
									<IconChevronDown class="h-5 w-5 text-ink-soft" />
								{/if}
							</div>
						</button>

						<!-- Expanded Content -->
						{#if isExpanded}
							<div class="p-4 space-y-4">
								<!-- Player Tags -->
								{#if playerCount > 0}
									<div class="flex flex-wrap gap-2">
										{#each group.playerNames as name, ni (ni)}
											<span class="inline-flex items-center gap-1 bg-primary-soft text-primary px-3 py-1.5 rounded-full text-sm font-medium">
												{name}
												<button
													type="button"
													onclick={() => removePlayer(group.id, ni)}
													class="hover:text-error transition-colors"
												>
													<IconX class="h-3 w-3" />
												</button>
											</span>
										{/each}
									</div>
								{/if}

								<!-- Add Player Input -->
								<div>
									<input
										type="text"
										placeholder={m.player_name_placeholder()}
										class="w-full h-11 px-4 rounded-xl border border-border bg-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all"
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												const input = e.target as HTMLInputElement;
												addPlayerToGroup(group.id, input.value);
												input.value = '';
											}
										}}
									/>
								</div>

								<!-- Bulk Paste -->
								<div>
									<textarea
										placeholder="Dán danh sách tên (phân cách bằng dấu phẩy hoặc xuống dòng)"
										class="w-full h-16 px-4 py-3 rounded-xl border border-border bg-white text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all"
										onblur={(e) => handleBulkPaste(group.id, e)}
									></textarea>
								</div>

								<!-- Delete Group -->
								{#if groups.length > 1}
									<button
										type="button"
										onclick={() => removeGroup(group.id)}
										class="w-full py-3 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-ink-soft hover:border-error hover:text-error transition-colors"
									>
										<IconTrash class="h-4 w-4" />
										<span class="text-sm font-semibold">Xóa nhóm</span>
									</button>
								{/if}
							</div>
						{/if}
					</div>
				{/each}

				<!-- Add Group Button -->
				<button
					type="button"
					onclick={addGroup}
					class="w-full py-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-primary hover:bg-primary-soft/30 transition-colors active:scale-98"
				>
					<IconCirclePlus class="h-5 w-5" />
					<span class="font-semibold text-sm uppercase tracking-wider">Thêm nhóm</span>
				</button>
			</div>
		</section>

		<!-- Stats Grid (Bento Style) -->
		<section class="grid grid-cols-2 gap-3 mb-6">
			<div class="bg-white p-4 rounded-xl shadow-card border border-border flex flex-col gap-2">
				<IconBolt class="h-5 w-5 text-primary-soft-strong" />
				<p class="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Cường độ</p>
				<p class="font-display! font-semibold text-lg text-ink">
					{totalPlayers >= 8 ? 'Cao' : totalPlayers >= 4 ? 'Trung bình' : 'Thấp'}
				</p>
			</div>
			<div class="bg-white p-4 rounded-xl shadow-card border border-border flex flex-col gap-2">
				<IconCash class="h-5 w-5 text-secondary" />
				<p class="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">Chia đều</p>
				<p class="font-display! font-semibold text-lg text-ink">
					{totalPlayers > 0 ? formatCurrency(Math.round(estimatedCost() / totalPlayers)) + '/ng' : '--'}
				</p>
			</div>
		</section>
	</main>

	<!-- CTA Buttons -->
	<div class="fixed bottom-16 left-0 w-full px-4 flex gap-3 bg-linear-to-t from-surface via-surface to-transparent pt-6 pb-4">
		<button
			class="flex-1 h-14 bg-white border-2 border-primary text-primary rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
		>
			<IconShare class="h-5 w-5" />
			Mời thêm
		</button>
		<button
			onclick={handleSaveAndShare}
			disabled={!isValid || saving}
			class="flex-2 h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{saving ? 'Đang tạo...' : 'Sẵn sàng chơi'}
			<IconArrowRight class="h-5 w-5" />
		</button>
	</div>

	<!-- Bottom Navigation Bar -->
	<nav class="fixed bottom-0 w-full z-50 border-t border-border bg-white flex justify-around items-center h-16 px-2">
		<a href="/" class="flex flex-col items-center justify-center text-ink-soft active:scale-98 transition-transform duration-150 gap-1">
			<IconLayoutGrid class="h-6 w-6" />
			<span class="font-display! font-medium text-[10px]">Home</span>
		</a>
		<a href="/create" class="flex flex-col items-center justify-center text-primary font-bold active:scale-98 transition-transform duration-150 gap-1">
			<IconCalendar class="h-6 w-6" />
			<span class="font-display! font-medium text-[10px]">Lịch</span>
		</a>
		<a href="/wallet" class="flex flex-col items-center justify-center text-ink-soft active:scale-98 transition-transform duration-150 gap-1">
			<IconWallet class="h-6 w-6" />
			<span class="font-display! font-medium text-[10px]">Ví</span>
		</a>
		<a href="/profile" class="flex flex-col items-center justify-center text-ink-soft active:scale-98 transition-transform duration-150 gap-1">
			<IconUser class="h-6 w-6" />
			<span class="font-display! font-medium text-[10px]">Cá nhân</span>
		</a>
	</nav>
</div>
