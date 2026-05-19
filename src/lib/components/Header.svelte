<script lang="ts">
	import { Settings, User, LogOut } from 'lucide-svelte';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { operativeStore } from '$lib/stores/operative.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import OperativeAvatar from './OperativeAvatar.svelte';

	const navItems = [
		{ name: 'BATTLE', href: `${base}/` },
		{ name: 'LEADERBOARD', href: `${base}/leaderboard` },
		{ name: 'RECRUITS', href: `${base}/recruits` },
		{ name: 'PREDICTOR', href: `${base}/predictor` },
		{ name: 'INTEL', href: `${base}/intel` }
	];

	function handleLogout() {
		authStore.signOut();
		goto(`${base}/`);
	}
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
		{#if authStore.isAuthenticated}
			<div class="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-sm px-3 py-1.5">
				<div class="w-5 h-5 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20">
					<OperativeAvatar avatar={operativeStore.operative?.avatar_url} size={12} class="text-primary" />
				</div>
				<span class="text-xs font-label font-bold text-white tracking-wider uppercase">
					{authStore.username || 'ALEKS'}
				</span>
				<button
					onclick={handleLogout}
					class="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/15 hover:bg-secondary/30 border border-secondary/30 rounded-sm text-secondary font-label text-[9px] font-bold tracking-[0.15em] uppercase transition-all shadow-[0_0_10px_rgba(255,61,0,0.15)] hover:shadow-[0_0_15px_rgba(255,61,0,0.35)] active:scale-95 cursor-pointer ml-2 animate-pulse hover:animate-none"
					title="TERMINATE ACTIVE SESSION"
				>
					<LogOut size={10} />
					TERMINATE SESSION
				</button>
			</div>
		{:else}
			<button class="hover:opacity-80 transition-opacity cursor-pointer">
				<User size={20} />
			</button>
		{/if}
		<button class="hover:opacity-80 transition-opacity cursor-pointer">
			<Settings size={20} />
		</button>
	</div>
</header>
