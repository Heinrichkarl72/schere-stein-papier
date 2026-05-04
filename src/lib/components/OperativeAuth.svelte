<script lang="ts">
	import { operativeStore } from '$lib/stores/operative.svelte';
	import { Terminal, ShieldCheck, AlertCircle, Loader2 } from 'lucide-svelte';

	let callsign = $state('');
	let isSubmitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!callsign.trim() || isSubmitting) return;

		isSubmitting = true;
		await operativeStore.login(callsign);
		isSubmitting = false;
	}
</script>

<div class="fixed inset-0 bg-surface flex items-center justify-center p-6 z-50">
	<!-- Background Effects -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 blur-[100px] rounded-full"></div>
		<div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 blur-[100px] rounded-full"></div>
	</div>

	<div class="w-full max-w-md relative">
		<!-- Decorative Elements -->
		<div class="absolute -top-12 -left-12 text-primary/10">
			<Terminal size={120} strokeWidth={0.5} />
		</div>

		<div class="glass-heavy p-10 border-primary/20 relative overflow-hidden">
			<!-- Scanning Line Animation -->
			<div class="absolute top-0 left-0 right-0 h-[1px] bg-primary/30 shadow-[0_0_10px_rgba(0,255,255,0.5)] animate-[scan_3s_linear_infinite]"></div>

			<div class="flex items-center gap-3 mb-8">
				<div class="p-2 bg-primary/10 rounded">
					<ShieldCheck class="text-primary" size={24} />
				</div>
				<div>
					<h1 class="text-xl font-headline font-bold text-white tracking-widest uppercase">ARENA.OPS</h1>
					<p class="text-[10px] font-label text-white/40 tracking-[0.2em]">IDENTIFICATION REQUIRED</p>
				</div>
			</div>

			<form onsubmit={handleSubmit} class="space-y-6">
				<div>
					<label for="callsign" class="block text-[10px] font-label font-bold text-primary tracking-[0.2em] uppercase mb-2 ml-1">
						Operative Callsign
					</label>
					<div class="relative group">
						<input
							type="text"
							id="callsign"
							bind:value={callsign}
							placeholder="ENTER CALLSIGN..."
							required
							class="w-full bg-white/2 border border-white/10 rounded-sm px-4 py-4 text-white font-label tracking-widest focus:outline-none focus:border-primary/50 focus:bg-white/5 transition-all placeholder:text-white/10"
						/>
						<div class="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left"></div>
					</div>
				</div>

				{#if operativeStore.error}
					<div class="flex items-center gap-2 p-3 bg-secondary/10 border border-secondary/20 rounded-sm" in:fade>
						<AlertCircle class="text-secondary" size={16} />
						<p class="text-xs text-secondary/90 font-medium">{operativeStore.error}</p>
					</div>
				{/if}

				<button
					type="submit"
					disabled={isSubmitting || !callsign.trim()}
					class="w-full py-4 bg-primary text-surface font-headline font-bold tracking-[0.3em] relative overflow-hidden hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_20px_rgba(0,255,255,0.2)]"
				>
					{#if isSubmitting}
						<div class="flex items-center justify-center gap-2">
							<Loader2 size={18} class="animate-spin" />
							<span>INITIALIZING...</span>
						</div>
					{:else}
						INITIALIZE LINK
					{/if}
				</button>
			</form>

			<div class="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-label text-white/20 tracking-widest uppercase">
				<span>SECURE CONNECTION</span>
				<div class="flex gap-1">
					<div class="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
					<div class="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
					<div class="w-1 h-1 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes scan {
		0% {
			top: 0;
		}
		100% {
			top: 100%;
		}
	}
</style>
