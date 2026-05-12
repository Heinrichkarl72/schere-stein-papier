<script lang="ts">
	import { Settings, User } from 'lucide-svelte';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { operativeStore } from '$lib/stores/operative.svelte';
	import OperativeAvatar from './OperativeAvatar.svelte';

	const navItems = [
		{ name: 'BATTLE', href: `${base}/` },
		{ name: 'LEADERBOARD', href: `${base}/leaderboard` },
		{ name: 'RECRUITS', href: `${base}/recruits` },
		{ name: 'PREDICTOR', href: `${base}/predictor` },
		{ name: 'INTEL', href: `${base}/intel` }
	];
</script>

<header class="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-surface">
	<div class="flex items-center gap-2">
		<a href="{base}/" class="text-2xl font-headline font-bold text-primary italic tracking-wider hover:opacity-80 transition-opacity">
			ARENA.OPS
		</a>
	</div>

	<nav class="hidden md:flex items-center gap-8">
		{#each navItems as item}
			{@const isActive = page.url.pathname === item.href}
			<a
				href={item.href}
				class="text-sm font-label font-semibold transition-all relative pb-1
                {isActive ? 'text-primary' : 'text-white/50 hover:text-white'}"
			>
				{item.name}
				{#if isActive}
					<div
						class="absolute -bottom-4 left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_rgba(0,255,255,0.8)]"
					></div>
				{/if}
			</a>
		{/each}
	</nav>

	<div class="flex items-center gap-6 text-primary">
		<button class="hover:opacity-80 transition-opacity cursor-pointer">
			<Settings size={20} />
		</button>
		<button class="hover:opacity-80 transition-opacity cursor-pointer">
			{#if operativeStore.isLoggedIn}
				<div class="w-6 h-6 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20">
					<OperativeAvatar avatar={operativeStore.operative?.avatar_url} size={14} class="text-primary" />
				</div>
			{:else}
				<User size={20} />
			{/if}
		</button>
	</div>
</header>
