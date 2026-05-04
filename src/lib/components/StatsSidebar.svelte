<script lang="ts">
	import { operativeStore } from '$lib/stores/operative.svelte';
</script>

<aside class="w-72 border-l border-white/5 p-8 flex flex-col h-full items-center">
	<h2 class="text-3xl font-headline font-bold text-white tracking-widest text-center">STATS</h2>
	<p class="text-sm italic text-primary mt-1 mb-12">Your progress</p>

	<div class="space-y-12 w-full">
		<div class="flex flex-col items-center">
			<span class="text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase mb-1">WINS</span>
			<span class="text-7xl font-headline font-bold text-primary drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
				{operativeStore.stats.wins.toString().padStart(2, '0')}
			</span>
		</div>

		<div class="flex flex-col items-center">
			<span class="text-[10px] font-label font-bold text-secondary tracking-[0.3em] uppercase mb-1">LOSSES</span>
			<span class="text-7xl font-headline font-bold text-secondary drop-shadow-[0_0_15px_rgba(255,61,0,0.3)]">
				{operativeStore.stats.losses.toString().padStart(2, '0')}
			</span>
		</div>

		<div class="flex flex-col items-center">
			<span class="text-[10px] font-label font-bold text-tertiary tracking-[0.3em] uppercase mb-1">DRAWS</span>
			<span class="text-7xl font-headline font-bold text-tertiary drop-shadow-[0_0_15px_rgba(255,214,0,0.3)]">
				{operativeStore.stats.draws.toString().padStart(2, '0')}
			</span>
		</div>
	</div>

	<div class="mt-auto w-full pt-8">
		<button
			onclick={() => operativeStore.resetStats()}
			class="w-full py-3 border border-white/10 rounded-sm text-[10px] font-label font-bold text-white/30 tracking-[0.2em] hover:bg-white/5 hover:text-white transition-all uppercase"
		>
			RESET STATS
		</button>
	</div>
</aside>
