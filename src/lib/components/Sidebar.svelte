<script lang="ts">
	import { LayoutGrid, Swords, Shield, Settings, ChevronRight, Target } from 'lucide-svelte';
	import { operativeStore } from '$lib/stores/operative.svelte';
	import OperativeAvatar from './OperativeAvatar.svelte';

	import { page } from '$app/state';
	import { base } from '$app/paths';

	const menuItems = $derived([
		{ id: 'dashboard', label: 'DASHBOARD', icon: LayoutGrid, href: `${base}/` },
		{ id: 'battle-log', label: 'BATTLE LOG', icon: Swords, href: `${base}/intel` },
		{ id: 'arsenal', label: 'ARSENAL', icon: Shield, href: `${base}/arsenal` },
		{ id: 'predictor', label: 'PREDICTOR', icon: Target, href: `${base}/predictor` },
		{ id: 'leaderboard', label: 'LEADERBOARD', icon: LayoutGrid, href: `${base}/leaderboard` }
	]);

	// Rank Logic (duplicated for consistency, or I could move it to the store)
	const levels = [
		{ lvl: 1, name: 'RECRUIT', xp: 0 },
		{ lvl: 2, name: 'INITIATE', xp: 10 },
		{ lvl: 3, name: 'OPERATIVE', xp: 25 },
		{ lvl: 4, name: 'ELITE', xp: 50 },
		{ lvl: 5, name: 'GHOST', xp: 100 }
	];
	const currentLevel = $derived.by(() => {
		const total = operativeStore.totalGames;
		return [...levels].reverse().find(l => total >= l.xp) || levels[0];
	});
</script>

<aside class="w-64 border-r border-white/5 flex flex-col h-full bg-surface">
	<!-- Operative Profile -->
	<div class="p-6 border-b border-white/5 bg-primary/2">
		<div class="flex items-center gap-4">
			<div class="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20">
				<OperativeAvatar avatar={operativeStore.operative?.avatar_url} size={24} class="text-primary drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]" />
			</div>
			<div class="overflow-hidden">
				<div class="text-xs font-label font-bold text-primary tracking-widest uppercase truncate">
					{operativeStore.callsign || 'OFFLINE'}
				</div>
				<div class="text-[9px] font-label text-white/40 tracking-widest uppercase mt-0.5 flex items-center gap-1">
					<div class="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
					{currentLevel.name}
				</div>
			</div>
		</div>
	</div>

	<!-- Menu -->
	<nav class="flex-1 py-4">
		{#each menuItems as item}
			{@const isActive = page.url.pathname === item.href}
			<a
				href={item.href}
				class="w-full flex items-center gap-4 px-6 py-4 transition-all group relative
                {isActive ? 'text-primary' : 'text-white/40 hover:text-white'}"
			>
				{#if isActive}
					<div class="absolute right-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,255,255,0.5)]"></div>
				{/if}
				<item.icon size={18} class={isActive ? 'drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]' : ''} />
				<span class="text-[11px] font-label font-bold tracking-[0.2em]">{item.label}</span>
			</a>
		{/each}
	</nav>
</aside>
