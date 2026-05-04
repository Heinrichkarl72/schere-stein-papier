<script lang="ts">
	import { Settings, User } from 'lucide-svelte';
</script>

<header class="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-surface">
	<div class="flex items-center gap-2">
		<span class="text-2xl font-headline font-bold text-primary italic tracking-wider">ARENA.OPS</span>
	</div>

	<nav class="hidden md:flex items-center gap-8">
		<a href="/" class="text-sm font-label font-semibold text-primary border-b-2 border-primary pb-1">BATTLE</a>
		<a href="/leaderboard" class="text-sm font-label font-semibold text-white/50 hover:text-white transition-colors">LEADERBOARD</a>
		<a href="/recruits" class="text-sm font-label font-semibold text-white/50 hover:text-white transition-colors">RECRUITS</a>
		<a href="/intel" class="text-sm font-label font-semibold text-white/50 hover:text-white transition-colors">INTEL</a>
	</nav>

	<div class="flex items-center gap-6 text-primary">
		<button class="hover:opacity-80 transition-opacity cursor-pointer">
			<Settings size={20} />
		</button>
		<button class="hover:opacity-80 transition-opacity cursor-pointer">
			<User size={20} />
		</button>
	</div>
</header>
