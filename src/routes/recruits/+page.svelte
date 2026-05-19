<script lang="ts">
	import { operativeStore } from '$lib/stores/operative.svelte';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatsSidebar from '$lib/components/StatsSidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	import { 
		User, Shield, Zap, Award, Star, Crosshair, 
		Ghost, Eye, Binary, Cpu, Fingerprint, Lock,
		Check, Save, Edit2, ChevronRight
	} from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';

	// Avatar options (Lucide icons as names)
	const avatars = [
		{ name: 'Ghost', icon: Ghost },
		{ name: 'Shield', icon: Shield },
		{ name: 'Zap', icon: Zap },
		{ name: 'Target', icon: Crosshair },
		{ name: 'Eye', icon: Eye },
		{ name: 'Binary', icon: Binary },
		{ name: 'Cpu', icon: Cpu },
		{ name: 'Fingerprint', icon: Fingerprint }
	];

	let isEditingCallsign = $state(false);
	let newCallsign = $state(operativeStore.callsign);
	let selectedAvatar = $state(operativeStore.operative?.avatar_url || 'Ghost');
	let isSaving = $state(false);

	async function updateProfile() {
		isSaving = true;
		const success = await operativeStore.updateOperative({
			callsign: newCallsign,
			avatar_url: selectedAvatar
		});
		if (success) {
			isEditingCallsign = false;
		}
		isSaving = false;
	}

	// Rank Calculation
	const levels = [
		{ lvl: 1, name: 'RECRUIT', xp: 0 },
		{ lvl: 2, name: 'INITIATE', xp: 10 },
		{ lvl: 3, name: 'OPERATIVE', xp: 25 },
		{ lvl: 4, name: 'ELITE', xp: 50 },
		{ lvl: 5, name: 'GHOST', xp: 100 },
		{ lvl: 6, name: 'LEGEND', xp: 250 }
	];

	const currentLevel = $derived.by(() => {
		const total = operativeStore.totalGames;
		return [...levels].reverse().find(l => total >= l.xp) || levels[0];
	});

	const nextLevel = $derived(levels[levels.indexOf(currentLevel) + 1] || null);
	const progress = $derived.by(() => {
		if (!nextLevel) return 100;
		const currentXP = operativeStore.totalGames - currentLevel.xp;
		const neededXP = nextLevel.xp - currentLevel.xp;
		return Math.min(100, Math.round((currentXP / neededXP) * 100));
	});

	// Achievements
	const achievements = $derived([
		{ id: 'first_blood', name: 'FIRST BLOOD', desc: 'Secure your first victory', unlocked: operativeStore.stats.wins >= 1, icon: Crosshair },
		{ id: 'initiate', name: 'INITIATE', desc: 'Complete 10 engagements', unlocked: operativeStore.totalGames >= 10, icon: Zap },
		{ id: 'strategist', name: 'STRATEGIST', desc: 'Achieve 25 victories', unlocked: operativeStore.stats.wins >= 25, icon: Shield },
		{ id: 'veteran', name: 'VETERAN', desc: 'Complete 50 engagements', unlocked: operativeStore.totalGames >= 50, icon: Award },
		{ id: 'arena_master', name: 'ARENA MASTER', desc: 'Achieve 100 victories', unlocked: operativeStore.stats.wins >= 100, icon: Star }
	]);

	const SelectedIcon = $derived(avatars.find(a => a.name === selectedAvatar)?.icon || Ghost);
</script>

<svelte:head>
	<title>ARENA.OPS | RECRUITS</title>
</svelte:head>


	<div class="flex flex-col h-screen bg-surface selection:bg-primary/20 selection:text-white">
		<Header />

		<main class="flex-1 flex overflow-hidden">
			<Sidebar />

			<!-- Recruits Content -->
			<section class="flex-1 overflow-y-auto p-12 flex flex-col items-center">
				<div class="w-full max-w-4xl space-y-12">
					
					<!-- Personnel File Header -->
					<div class="flex items-end justify-between border-b border-white/5 pb-6">
						<div>
							<h1 class="text-4xl font-headline font-bold text-white tracking-[0.2em] flex items-center gap-4">
								<Fingerprint class="text-primary" size={36} />
								PERSONNEL FILE
							</h1>
							<p class="text-primary font-label text-sm tracking-[0.2em] mt-2 italic uppercase">
								Classified Operative Identity Management
							</p>
						</div>
						<div class="text-right">
							<span class="text-white/30 text-[10px] font-label font-bold tracking-[0.2em] uppercase">Security Level</span>
							<div class="text-secondary font-headline text-sm glow-secondary">ALPHA-7</div>
						</div>
					</div>

					<!-- Operative Identity Card -->
					<div class="glass-heavy p-10 border-primary/20 relative overflow-hidden group">
						<!-- Scanner Effect -->
						<div class="absolute top-0 left-0 right-0 h-[1px] bg-primary/20 shadow-[0_0_15px_rgba(0,255,255,0.3)] animate-[scan_4s_linear_infinite]"></div>

						<div class="grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">
							<!-- Left: Avatar Display -->
							<div class="md:col-span-4 flex flex-col items-center gap-6">
								<div class="relative">
									<div class="w-40 h-40 rounded-sm bg-primary/5 border-2 border-primary/30 flex items-center justify-center relative overflow-hidden group/avatar">
										<SelectedIcon size={80} class="text-primary drop-shadow-[0_0_15px_rgba(0,255,255,0.4)]" />
										
										<!-- Grid Overlay -->
										<div class="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
									</div>
									<div class="absolute -bottom-2 -right-2 p-2 bg-primary text-surface rounded-full shadow-lg">
										<Shield size={16} />
									</div>
								</div>

								<div class="text-center">
									<div class="text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase mb-1">Rank Title</div>
									<div class="text-xl font-headline font-bold text-white tracking-widest">{currentLevel.name}</div>
								</div>
							</div>

							<!-- Right: Identity Details -->
							<div class="md:col-span-8 space-y-8">
								<div class="space-y-4">
									<div class="flex items-center justify-between">
										<span class="text-[10px] font-label font-bold text-white/30 tracking-[0.3em] uppercase">Operative Callsign</span>
										{#if !isEditingCallsign}
											<button onclick={() => isEditingCallsign = true} class="text-primary hover:text-white transition-colors">
												<Edit2 size={14} />
											</button>
										{/if}
									</div>
									
									{#if isEditingCallsign}
										<div class="flex gap-2" in:fade>
											<input 
												type="text" 
												bind:value={newCallsign}
												class="flex-1 bg-white/5 border border-primary/30 px-4 py-3 text-white font-headline tracking-widest focus:outline-none focus:border-primary"
												placeholder="ENTER NEW CALLSIGN..."
											/>
											<button 
												onclick={updateProfile}
												disabled={isSaving || !newCallsign.trim()}
												class="bg-primary text-surface px-4 py-3 font-bold hover:bg-primary-dim transition-all disabled:opacity-50"
											>
												<Save size={20} />
											</button>
										</div>
									{:else}
										<div class="text-5xl font-headline font-bold text-white tracking-tighter uppercase italic">
											{operativeStore.callsign}
										</div>
									{/if}
								</div>

								<!-- Rank Progression -->
								<div class="space-y-3">
									<div class="flex justify-between items-end">
										<div class="flex items-center gap-2">
											<span class="text-[10px] font-label font-bold text-primary tracking-[0.2em] uppercase">LEVEL {currentLevel.lvl}</span>
											<ChevronRight size={12} class="text-white/20" />
											<span class="text-[10px] font-label font-bold text-white/40 tracking-[0.2em] uppercase">
												{nextLevel ? `LEVEL ${nextLevel.lvl}` : 'MAX LEVEL'}
											</span>
										</div>
										<span class="text-[10px] font-label font-bold text-white/60 tracking-widest uppercase">{operativeStore.totalGames} / {nextLevel?.xp || 'MAX'} XP</span>
									</div>
									<div class="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-[2px]">
										<div 
											class="h-full bg-primary shadow-[0_0_15px_rgba(0,255,255,0.6)] rounded-full transition-all duration-1000 ease-out"
											style="width: {progress}%"
										></div>
									</div>
								</div>

								<!-- Avatar Selector -->
								<div class="space-y-4">
									<span class="text-[10px] font-label font-bold text-white/30 tracking-[0.3em] uppercase">Interface Customization</span>
									<div class="grid grid-cols-4 sm:grid-cols-8 gap-3">
										{#each avatars as avatar}
											<button 
												onclick={() => { selectedAvatar = avatar.name; updateProfile(); }}
												class="aspect-square glass-card border border-white/5 flex items-center justify-center hover:border-primary/50 transition-all relative
												{selectedAvatar === avatar.name ? 'border-primary bg-primary/10' : 'hover:bg-white/5'}"
											>
												<avatar.icon size={20} class={selectedAvatar === avatar.name ? 'text-primary' : 'text-white/30'} />
												{#if selectedAvatar === avatar.name}
													<div class="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
														<Check size={8} class="text-surface" strokeWidth={4} />
													</div>
												{/if}
											</button>
										{/each}
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Service Medals -->
					<div class="space-y-6">
						<div class="flex items-center gap-3">
							<Award class="text-tertiary" size={24} />
							<h2 class="text-xs font-label font-bold text-white tracking-[0.4em] uppercase">SERVICE MEDALS</h2>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
							{#each achievements as achievement}
								<div class="glass-card p-6 border-white/5 flex flex-col items-center text-center group transition-all
									{achievement.unlocked ? 'bg-primary/5 border-primary/20' : 'opacity-40 grayscale blur-[0.5px] hover:blur-0 hover:opacity-60'}">
									
									<div class="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-4 relative
										{achievement.unlocked ? 'border-primary/40' : ''}">
										<achievement.icon size={32} class={achievement.unlocked ? 'text-tertiary drop-shadow-[0_0_10px_rgba(255,214,0,0.4)]' : 'text-white/20'} />
										
										{#if !achievement.unlocked}
											<div class="absolute inset-0 flex items-center justify-center bg-surface/80 rounded-full">
												<Lock size={16} class="text-white/40" />
											</div>
										{/if}
									</div>

									<div class="text-[10px] font-label font-bold tracking-widest uppercase mb-1
										{achievement.unlocked ? 'text-white' : 'text-white/40'}">
										{achievement.name}
									</div>
									<div class="text-[8px] font-label text-white/30 uppercase tracking-tighter leading-tight">
										{achievement.desc}
									</div>

									{#if achievement.unlocked}
										<div class="mt-4 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[7px] font-label font-bold text-primary tracking-widest">
											UNLOCKED
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>

				</div>
			</section>

			<StatsSidebar />
		</main>

		<Footer />
	</div>


<style>
	@keyframes scan {
		0% { transform: translateY(0); opacity: 0; }
		5% { opacity: 1; }
		95% { opacity: 1; }
		100% { transform: translateY(320px); opacity: 0; }
	}

	:global(.glass-card) {
		background: rgba(15, 42, 53, 0.5);
		backdrop-filter: blur(8px);
		border-radius: 4px;
	}
</style>
