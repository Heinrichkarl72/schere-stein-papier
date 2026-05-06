<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { operativeStore } from '$lib/stores/operative.svelte';
	import { MOVE_EMOJI, MOVE_LABEL } from '$lib/engine';
	import type { Move, GameSession } from '$lib/types';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatsSidebar from '$lib/components/StatsSidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import OperativeAuth from '$lib/components/OperativeAuth.svelte';
	import { Sword, Box, Shield, Zap, Target, Cpu, LayoutGrid, Check, Settings, Activity } from 'lucide-svelte';
	import { fade, fly, scale } from 'svelte/transition';

	let loading = $state(true);
	let allSessions = $state<GameSession[]>([]);
	let selectedSkin = $derived(operativeStore.equippedSkin);
	let isSaving = $state(false);
	let showFeedback = $state(false);

	const skins = [
		{ name: 'Default Neon', class: 'skin-neon', desc: 'Standard issue glowing cyan interface.' },
		{ name: 'Classic Terminal', class: 'skin-terminal', desc: 'Retro amber CRT aesthetic.' },
		{ name: 'Ghost Protocol', class: 'skin-ghost', desc: 'Stealth grayscale monochromatic mode.' },
		{ name: 'Overdrive', class: 'skin-overdrive', desc: 'High-energy red and orange heat map.' }
	];

	async function fetchStats() {
		if (!operativeStore.operative) return;
		loading = true;
		try {
			const { data, error } = await supabase
				.from('game_sessions')
				.select('*')
				.eq('operative_id', operativeStore.operative.id);

			if (error) throw error;
			allSessions = data || [];
		} catch (err) {
			console.error('Error fetching arsenal stats:', err);
		} finally {
			loading = false;
		}
	}

	async function equipSkin(skinName: string) {
		isSaving = true;
		const success = await operativeStore.updateOperative({
			active_skin: skinName
		});
		if (success) {
			showFeedback = true;
			setTimeout(() => { showFeedback = false; }, 3000);
		}
		isSaving = false;
	}

	onMount(() => {
		if (operativeStore.isLoggedIn) {
			fetchStats();
		}
	});

	// Analytics Calculation
	const weaponStats = $derived.by(() => {
		const stats = {
			rock: { usage: 0, wins: 0, kos: 0 },
			paper: { usage: 0, wins: 0, kos: 0 },
			scissors: { usage: 0, wins: 0, kos: 0 }
		};

		allSessions.forEach(s => {
			const move = s.player_move;
			stats[move].usage += 1;
			if (s.result === 'win') {
				stats[move].wins += 1;
				stats[move].kos += 1; // Assuming every win is a KO in this context
			}
		});

		return Object.entries(stats).map(([key, value]) => ({
			move: key as Move,
			...value,
			winRate: value.usage > 0 ? Math.round((value.wins / value.usage) * 100) : 0
		}));
	});

	const totalUsage = $derived(allSessions.length || 1);
</script>

<svelte:head>
	<title>ARENA.OPS | ARSENAL</title>
</svelte:head>

{#if !operativeStore.isLoggedIn}
	<OperativeAuth />
{:else}
	<div class="flex flex-col h-screen bg-surface selection:bg-primary/20 selection:text-white">
		<Header />

		<main class="flex-1 flex overflow-hidden">
			<Sidebar />

			<!-- Arsenal Content -->
			<section class="flex-1 overflow-y-auto p-12 flex flex-col items-center">
				<div class="w-full max-w-5xl space-y-12">
					
					<!-- Arsenal Header -->
					<div class="flex items-end justify-between border-b border-white/5 pb-8">
						<div>
							<h1 class="text-4xl font-headline font-bold text-white tracking-[0.3em] flex items-center gap-4 uppercase">
								<Sword class="text-primary" size={36} />
								Tactical Arsenal
							</h1>
							{#if showFeedback}
								<div in:fly={{ y: -10 }} out:fade class="absolute mt-2 text-win font-label text-[10px] tracking-[0.2em] uppercase font-bold flex items-center gap-2">
									<div class="w-1 h-1 bg-win rounded-full animate-ping"></div>
									SUCCESS: SYSTEM UPDATED
								</div>
							{/if}
							<p class="text-primary font-label text-sm tracking-[0.2em] mt-2 italic uppercase">
								Weapon Systems Analysis & Customization
							</p>
						</div>
						<div class="text-right">
							<span class="text-white/30 text-[10px] font-label font-bold tracking-[0.2em] uppercase">Status</span>
							<div class="text-primary font-headline text-sm animate-pulse">ARMORY_ONLINE</div>
						</div>
					</div>

					<!-- Weapon Analytics -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
						{#each weaponStats as weapon, i}
							<div 
								in:fly={{ y: 20, delay: i * 100 }}
								class="glass-heavy p-8 border-white/5 relative overflow-hidden group"
							>
								<!-- Blueprint Background Pattern -->
								<div class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,var(--color-primary)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
								
								<div class="relative z-10 flex flex-col h-full">
									<div class="flex items-center justify-between mb-8">
										<div class="text-5xl group-hover:scale-110 transition-transform duration-500">
											{MOVE_EMOJI[weapon.move]}
										</div>
										<div class="text-right">
											<div class="text-[10px] font-label font-bold text-white/30 tracking-widest uppercase">System</div>
											<div class="text-xs font-headline font-bold text-primary tracking-widest uppercase">{MOVE_LABEL[weapon.move]}</div>
										</div>
									</div>

									<!-- Analytics Grid -->
									<div class="grid grid-cols-2 gap-4 mt-auto">
										<div class="p-3 bg-white/2 border border-white/5 rounded-sm">
											<div class="text-[9px] font-label text-white/30 uppercase tracking-widest mb-1">Usage</div>
											<div class="text-xl font-headline font-bold text-white">{Math.round((weapon.usage / totalUsage) * 100)}%</div>
										</div>
										<div class="p-3 bg-white/2 border border-white/5 rounded-sm">
											<div class="text-[9px] font-label text-white/30 uppercase tracking-widest mb-1">Efficiency</div>
											<div class="text-xl font-headline font-bold text-win">{weapon.winRate}%</div>
										</div>
										<div class="p-3 bg-white/2 border border-white/5 rounded-sm col-span-2">
											<div class="text-[9px] font-label text-white/30 uppercase tracking-widest mb-1">Total Neutralized</div>
											<div class="text-xl font-headline font-bold text-primary tracking-tighter">{weapon.kos} TARGETS</div>
										</div>
									</div>
								</div>

								<!-- Technical Borders -->
								<div class="absolute top-0 left-0 w-4 h-4 border-t border-l border-primary/40"></div>
								<div class="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-primary/40"></div>
							</div>
						{/each}
					</div>

					<!-- Visual Skins Gallery -->
					<div class="space-y-6">
						<div class="flex items-center gap-3">
							<Cpu class="text-secondary" size={24} />
							<h2 class="text-xs font-label font-bold text-white tracking-[0.4em] uppercase">VISUAL SKINS GALLERY</h2>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
							{#each skins as skin}
								<div 
									class="glass-card p-6 border-white/5 flex flex-col gap-4 relative overflow-hidden transition-all
									{selectedSkin === skin.name ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:border-white/20'}"
								>
									<div class="flex items-center justify-between">
										<div class="w-10 h-10 rounded bg-white/5 flex items-center justify-center {skin.class}">
											<Box size={20} />
										</div>
										{#if selectedSkin === skin.name}
											<div in:scale class="text-primary flex items-center gap-1 text-[10px] font-label font-bold tracking-widest">
												<Check size={14} />
												EQUIPPED
											</div>
										{/if}
									</div>

									<div>
										<h3 class="text-sm font-headline font-bold text-white tracking-widest uppercase">{skin.name}</h3>
										<p class="text-[10px] font-label text-white/30 uppercase leading-relaxed mt-1">{skin.desc}</p>
									</div>

									{#if selectedSkin !== skin.name}
										<button 
											onclick={() => equipSkin(skin.name)}
											disabled={isSaving}
											class="mt-4 w-full py-2 border border-white/10 text-[10px] font-label font-bold tracking-[0.2em] uppercase hover:bg-white/5 transition-all disabled:opacity-50"
										>
											Equip System
										</button>
									{/if}

									<!-- Decorative Skin Indicator -->
									<div class="absolute bottom-0 left-0 right-0 h-[2px] {skin.class}-bg opacity-50"></div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Technical Specifications Section -->
					<div class="glass-heavy p-10 border-white/5 bg-surface-darker/50">
						<div class="flex items-center gap-3 mb-8">
							<Activity class="text-primary" size={20} />
							<h3 class="text-xs font-label font-bold text-white tracking-[0.3em] uppercase">SYSTEM CALIBRATION</h3>
						</div>
						
						<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
							<div class="space-y-4">
								<div class="text-[10px] font-label font-bold text-white/30 tracking-[0.2em] uppercase">Core Logic Engaged</div>
								<div class="space-y-2">
									<div class="flex justify-between items-center text-[11px] font-label text-white/60">
										<span>NEURAL LINK STABILITY</span>
										<span class="text-primary">98.4%</span>
									</div>
									<div class="h-1 w-full bg-white/5">
										<div class="h-full bg-primary" style="width: 98%"></div>
									</div>
								</div>
								<div class="space-y-2">
									<div class="flex justify-between items-center text-[11px] font-label text-white/60">
										<span>REFLEX SYNCHRONIZATION</span>
										<span class="text-secondary">MAX</span>
									</div>
									<div class="h-1 w-full bg-white/5">
										<div class="h-full bg-secondary" style="width: 100%"></div>
									</div>
								</div>
							</div>

							<div class="p-6 border border-primary/10 bg-primary/2 rounded-sm flex items-center gap-6">
								<div class="p-4 bg-primary/10 rounded-full">
									<Target class="text-primary" size={24} />
								</div>
								<div>
									<h4 class="text-xs font-label font-bold text-white tracking-widest uppercase mb-1">AUTO-CALIBRATION</h4>
									<p class="text-[9px] font-label text-white/40 uppercase leading-relaxed">
										Weapon systems are continuously optimized based on engagement history. Skin updates do not affect core combat mechanics.
									</p>
								</div>
							</div>
						</div>
					</div>

				</div>
			</section>

			<StatsSidebar />
		</main>

		<Footer />
	</div>
{/if}

<style>
	/* Skin Styles */
	.skin-neon { color: var(--color-primary); }
	.skin-neon-bg { background: var(--color-primary); }
	
	.skin-terminal { color: #00FF41; }
	.skin-terminal-bg { background: #00FF41; }
	
	.skin-ghost { color: #FFFFFF; }
	.skin-ghost-bg { background: #FFFFFF; }
	
	.skin-overdrive { color: #FF3D00; }
	.skin-overdrive-bg { background: #FF3D00; }

	:global(.glass-card) {
		background: rgba(15, 42, 53, 0.5);
		backdrop-filter: blur(8px);
		border-radius: 4px;
	}
</style>
