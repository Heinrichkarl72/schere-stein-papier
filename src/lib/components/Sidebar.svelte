<script lang="ts">
	import { LayoutGrid, Swords, Shield, Settings } from 'lucide-svelte';
	import { operativeStore } from '$lib/stores/operative.svelte';

	const menuItems = [
		{ id: 'dashboard', label: 'DASHBOARD', icon: LayoutGrid, active: true },
		{ id: 'battle-log', label: 'BATTLE LOG', icon: Swords },
		{ id: 'arsenal', label: 'ARSENAL', icon: Shield },
		{ id: 'settings', label: 'SETTINGS', icon: Settings }
	];
</script>

<aside class="w-64 border-r border-white/5 flex flex-col h-full">
	<!-- Operative Profile -->
	<div class="p-6 border-b border-white/5">
		<div class="flex items-center gap-4">
			<div class="w-12 h-12 rounded bg-white/10 flex items-center justify-center overflow-hidden border border-white/10">
				<img src="https://api.dicebear.com/7.x/bottts/svg?seed={operativeStore.callsign}" alt="Avatar" class="w-full h-full object-cover" />
			</div>
			<div>
				<div class="text-xs font-label font-bold text-primary tracking-widest uppercase">
					{operativeStore.callsign || 'OPERATIVE_01'}
				</div>
				<div class="text-[10px] font-label text-white/40 tracking-widest uppercase mt-0.5">
					RANK: ELITE
				</div>
			</div>
		</div>
	</div>

	<!-- Menu -->
	<nav class="flex-1 py-4">
		{#each menuItems as item}
			<button
				class="w-full flex items-center gap-4 px-6 py-4 transition-all group relative
                {item.active ? 'text-primary' : 'text-white/40 hover:text-white'}"
			>
				{#if item.active}
					<div class="absolute right-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,255,255,0.5)]"></div>
				{/if}
				<item.icon size={18} class={item.active ? 'drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]' : ''} />
				<span class="text-[11px] font-label font-bold tracking-[0.2em]">{item.label}</span>
			</button>
		{/each}
	</nav>
</aside>
