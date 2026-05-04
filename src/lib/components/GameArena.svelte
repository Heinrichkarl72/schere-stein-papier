<script lang="ts">
	import { gameStore } from '$lib/stores/game.svelte';
	import { MOVE_EMOJI, MOVE_LABEL } from '$lib/engine';
	import type { Move } from '$lib/types';
	import { fade, fly } from 'svelte/transition';

	const moves: Move[] = ['rock', 'paper', 'scissors'];

	async function handleSelect(move: Move) {
		await gameStore.selectMove(move);
	}
</script>

<div class="flex-1 flex divide-x divide-white/5 overflow-hidden">
	<!-- Left Side: Game Header & Info -->
	<div class="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-surface to-surface-light/30">
		<div class="text-center z-10">
			<h1 class="text-7xl font-headline font-bold text-white tracking-tighter leading-none">
				PLAY<br />
				<span class="text-primary italic">.RPS</span>
			</h1>
			<p class="text-lg italic text-secondary mt-2">Beat the bot</p>

			<div class="mt-8 text-white/50 text-sm max-w-xs mx-auto leading-relaxed font-body">
				Challenge an AI in Rock Paper Scissors. Test your strategy and luck in the most advanced digital arena ever built.
			</div>

			<div class="mt-12">
				{#if gameStore.phase === 'idle' || gameStore.phase === 'result'}
					<button
						onclick={() => gameStore.startGame()}
						class="px-12 py-4 bg-primary text-surface font-headline font-bold text-lg tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)]"
					>
						START GAME
					</button>
				{:else}
					<div class="text-primary font-label font-bold tracking-[0.3em] animate-pulse">SESSION ACTIVE</div>
				{/if}
			</div>
		</div>

		<!-- Retro Console Image Placeholder -->
		<div class="mt-16 w-full max-w-sm aspect-video rounded-lg overflow-hidden border border-white/10 glass-panel p-2">
			<div class="w-full h-full bg-surface-darker rounded flex items-center justify-center">
				<img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800" alt="Tech" class="w-full h-full object-cover opacity-50 mix-blend-screen" />
			</div>
		</div>
	</div>

	<!-- Right Side: Interaction Area -->
	<div class="flex-1 flex flex-col p-12 bg-surface">
		<div class="flex-1 flex flex-col items-center justify-center">
			<h2 class="text-4xl font-headline font-bold text-white tracking-widest">
				VS <span class="text-primary">BOT</span>
			</h2>
			<p class="text-sm italic text-white/40 mt-1 mb-16">Make your move</p>

			<div class="grid grid-cols-3 gap-6 w-full max-w-md">
				{#each moves as move (move)}
					<button
						disabled={gameStore.phase !== 'selecting'}
						onclick={() => handleSelect(move)}
						class="flex flex-col items-center gap-4 p-6 glass-card border border-white/5 hover:border-primary/30 transition-all group
                        {gameStore.playerMove === move ? 'border-primary bg-primary/10' : ''}
                        {gameStore.phase !== 'selecting' ? 'opacity-50 grayscale' : 'hover:-translate-y-1'}"
					>
						<span class="text-4xl group-hover:scale-110 transition-transform">
							{MOVE_EMOJI[move]}
						</span>
						<span class="text-[10px] font-label font-bold tracking-widest text-white/40 group-hover:text-primary transition-colors">
							{MOVE_LABEL[move]}
						</span>
					</button>
				{/each}
			</div>

			<!-- Result Display -->
			<div class="mt-16 h-24 flex items-center justify-center">
				{#if gameStore.phase === 'revealing'}
					<div in:fade class="flex items-center gap-4">
						<div class="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
						<div class="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
						<div class="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
					</div>
				{:else if gameStore.phase === 'result' && gameStore.result}
					<div in:fly={{ y: 20 }} class="text-center">
						<div class="text-sm font-label font-bold tracking-[0.4em] uppercase mb-1
                            {gameStore.result === 'win' ? 'text-win' : gameStore.result === 'loss' ? 'text-loss' : 'text-draw'}">
							{gameStore.result === 'draw' ? 'STALEMATE' : gameStore.result === 'win' ? 'VICTORY' : 'DEFEAT'}
						</div>
						<div class="text-xs text-white/40">
							BOT PLAYED {MOVE_LABEL[gameStore.botMove!] || ''}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Status Panel -->
		<div class="mt-auto glass-panel p-8 flex flex-col items-center justify-center border-white/10 bg-white/2">
			<div class="text-[10px] font-label font-bold text-white/30 tracking-[0.3em] uppercase mb-2">CURRENT STATE</div>
			<div class="text-4xl font-headline font-bold text-white/10 italic tracking-widest">
				{#if gameStore.phase === 'idle'}
					WAITING...
				{:else if gameStore.phase === 'selecting'}
					SELECTING...
				{:else if gameStore.phase === 'revealing'}
					REVEALING...
				{:else}
					ROUND OVER
				{/if}
			</div>
		</div>
	</div>
</div>
