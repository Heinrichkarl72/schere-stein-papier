<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { operativeStore } from '$lib/stores/operative.svelte';
	import { MOVE_EMOJI, MOVE_LABEL } from '$lib/engine';
	import type { GameSession } from '$lib/types';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatsSidebar from '$lib/components/StatsSidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import OperativeAuth from '$lib/components/OperativeAuth.svelte';
	import { Activity, Shield, Target, Clock, ChevronRight } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';

	let sessions = $state<GameSession[]>([]);
	let loading = $state(true);

	async function fetchIntel() {
		if (!operativeStore.operative) return;
		loading = true;
		try {
			const { data, error } = await supabase
				.from('game_sessions')
				.select('*')
				.eq('operative_id', operativeStore.operative.id)
				.order('created_at', { ascending: false })
				.limit(20);

			if (error) throw error;
			sessions = data || [];
		} catch (err) {
			console.error('Error fetching intel:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (operativeStore.isLoggedIn) {
			fetchIntel();
		}
	});

	// Formatting helpers
	function formatTime(dateStr?: string) {
		if (!dateStr) return 'UNKNOWN';
		const date = new Date(dateStr);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	function formatDate(dateStr?: string) {
		if (!dateStr) return 'UNKNOWN';
		const date = new Date(dateStr);
		return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
	}

	const winRate = $derived(operativeStore.winRate);
	const dashOffset = $derived(251.2 - (251.2 * winRate) / 100);
</script>

<svelte:head>
	<title>ARENA.OPS | INTEL</title>
</svelte:head>

{#if !operativeStore.isLoggedIn}
	<OperativeAuth />
{:else}
	<div class="flex flex-col h-screen bg-surface selection:bg-primary/20 selection:text-white">
		<Header />

		<main class="flex-1 flex overflow-hidden">
			<Sidebar />

			<!-- Intel Content -->
			<section class="flex-1 overflow-y-auto p-12 flex flex-col items-center">
				<div class="w-full max-w-5xl">
					<!-- Tactical Header -->
					<div class="flex items-start justify-between mb-12 border-b border-white/5 pb-8">
						<div>
							<h1 class="text-4xl font-headline font-bold text-white tracking-widest flex items-center gap-4">
								<Activity class="text-primary" size={36} />
								OPERATIVE INTEL
							</h1>
							<p class="text-primary font-label text-sm tracking-[0.2em] mt-2 italic uppercase">
								Post-Action Analysis & Combat History
							</p>
						</div>
						
						<!-- Win Rate Dashboard -->
						<div class="flex items-center gap-8 glass-panel px-8 py-4 bg-primary/5">
							<div class="relative w-20 h-20">
								<svg class="w-full h-full -rotate-90">
									<circle
										cx="40"
										cy="40"
										r="36"
										fill="none"
										stroke="currentColor"
										stroke-width="4"
										class="text-white/5"
									/>
									<circle
										cx="40"
										cy="40"
										r="36"
										fill="none"
										stroke="currentColor"
										stroke-width="4"
										stroke-dasharray="251.2"
										stroke-dashoffset={dashOffset}
										stroke-linecap="round"
										class="text-primary transition-all duration-1000 ease-out"
										style="filter: drop-shadow(0 0 4px rgba(0,255,255,0.6))"
									/>
								</svg>
								<div class="absolute inset-0 flex flex-col items-center justify-center">
									<span class="text-xl font-headline font-bold text-white leading-none">{winRate}%</span>
								</div>
							</div>
							<div class="space-y-1">
								<span class="text-[10px] font-label font-bold text-white/30 tracking-[0.2em] uppercase">Combat Efficiency</span>
								<div class="text-2xl font-headline font-bold text-white leading-tight">
									{operativeStore.stats.wins} <span class="text-xs text-white/40 font-normal">WINS</span>
								</div>
								<div class="flex gap-4">
									<span class="text-[10px] font-label text-win/70 uppercase tracking-widest">SUCCESS</span>
									<span class="text-[10px] font-label text-loss/70 uppercase tracking-widest">FAILURE</span>
								</div>
							</div>
						</div>
					</div>

					<div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
						<!-- Timeline Column -->
						<div class="lg:col-span-2 space-y-6">
							<div class="flex items-center justify-between mb-4">
								<h2 class="text-xs font-label font-bold text-white tracking-[0.4em] uppercase flex items-center gap-2">
									<Target size={14} class="text-primary" />
									Recent Engagements
								</h2>
								<span class="text-[10px] font-label text-white/20 uppercase tracking-widest">Sector 7G Log</span>
							</div>

							{#if loading}
								<div class="space-y-4">
									{#each Array(5) as _}
										<div class="h-24 w-full glass-card animate-pulse bg-white/2 border-white/5"></div>
									{/each}
								</div>
							{:else if sessions.length === 0}
								<div class="glass-heavy p-12 text-center border-dashed border-white/10">
									<p class="text-white/40 font-label italic">NO RECENT COMBAT DATA FOUND</p>
									<a href="/" class="mt-4 inline-block text-primary font-label text-[10px] font-bold tracking-[0.2em] uppercase hover:text-white transition-colors">
										Initialize First Engagement →
									</a>
								</div>
							{:else}
								<div class="relative pl-8 space-y-4">
									<!-- Timeline Line -->
									<div class="absolute left-[15px] top-4 bottom-4 w-[1px] bg-white/5"></div>

									{#each sessions as session, i (session.id)}
										<div 
											in:fly={{ x: -20, delay: i * 50 }}
											class="group relative glass-card p-5 border-white/5 hover:border-primary/20 transition-all flex items-center justify-between"
										>
											<!-- Timeline Node -->
											<div class="absolute -left-[23px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-surface
												{session.result === 'win' ? 'bg-win shadow-[0_0_8px_rgba(0,255,136,0.6)]' : 
												 session.result === 'loss' ? 'bg-loss shadow-[0_0_8px_rgba(255,61,0,0.6)]' : 
												 'bg-draw shadow-[0_0_8px_rgba(255,214,0,0.6)]'}"
											></div>

											<div class="flex items-center gap-8">
												<div class="flex flex-col">
													<span class="text-[10px] font-label font-bold text-white/20 tracking-widest uppercase">
														{formatDate(session.created_at)}
													</span>
													<span class="text-xs font-headline text-white/60">
														{formatTime(session.created_at)}
													</span>
												</div>

												<div class="flex items-center gap-6">
													<div class="flex flex-col items-center">
														<span class="text-[8px] font-label text-primary/40 uppercase tracking-widest mb-1">YOU</span>
														<span class="text-2xl" title={MOVE_LABEL[session.player_move]}>
															{MOVE_EMOJI[session.player_move]}
														</span>
													</div>
													<div class="text-white/10 font-headline italic font-bold">VS</div>
													<div class="flex flex-col items-center">
														<span class="text-[8px] font-label text-secondary/40 uppercase tracking-widest mb-1">BOT</span>
														<span class="text-2xl" title={MOVE_LABEL[session.bot_move]}>
															{MOVE_EMOJI[session.bot_move]}
														</span>
													</div>
												</div>
											</div>

											<div class="flex flex-col items-end">
												<span class="text-[10px] font-label font-bold tracking-[0.2em] uppercase mb-1
													{session.result === 'win' ? 'text-win' : session.result === 'loss' ? 'text-loss' : 'text-draw'}">
													{session.result === 'draw' ? 'STALEMATE' : session.result === 'win' ? 'VICTORY' : 'DEFEAT'}
												</span>
												<div class="text-[9px] text-white/20 font-label tracking-widest uppercase">
													ID: {session.id.substring(0, 8)}
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Intel Sidebar Column -->
						<div class="space-y-8">
							<div class="glass-heavy p-8 border-primary/10">
								<h3 class="text-xs font-label font-bold text-primary tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
									<Shield size={14} />
									TACTICAL SUMMARY
								</h3>
								<div class="space-y-6">
									<div class="flex justify-between items-end border-b border-white/5 pb-2">
										<span class="text-[10px] font-label text-white/40 uppercase tracking-widest">Total Ops</span>
										<span class="font-headline font-bold text-white">{operativeStore.totalGames}</span>
									</div>
									<div class="flex justify-between items-end border-b border-white/5 pb-2">
										<span class="text-[10px] font-label text-white/40 uppercase tracking-widest">Success Rate</span>
										<span class="font-headline font-bold text-win">{winRate}%</span>
									</div>
									<div class="flex justify-between items-end border-b border-white/5 pb-2">
										<span class="text-[10px] font-label text-white/40 uppercase tracking-widest">Last Activity</span>
										<span class="font-headline font-bold text-white/60">{sessions[0] ? formatDate(sessions[0].created_at) : 'NONE'}</span>
									</div>
								</div>

								<div class="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-sm">
									<p class="text-[9px] font-label text-primary/70 leading-relaxed uppercase tracking-wider italic">
										"Tactical observation suggests a {winRate > 50 ? 'dominant' : 'recovering'} engagement pattern in this sector. Recommend continuing current operative strategy."
									</p>
								</div>
							</div>

							<div class="glass-panel p-8 border-white/5">
								<h3 class="text-xs font-label font-bold text-white/60 tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
									<Clock size={14} />
									SESSION STATS
								</h3>
								<div class="space-y-4">
									{#each ['wins', 'losses', 'draws'] as type}
										<div>
											<div class="flex justify-between text-[10px] font-label font-bold tracking-widest uppercase mb-1">
												<span class="text-white/40">{type}</span>
												<span class={type === 'wins' ? 'text-win' : type === 'losses' ? 'text-loss' : 'text-draw'}>
													{operativeStore.stats[type as keyof typeof operativeStore.stats]}
												</span>
											</div>
											<div class="h-1 w-full bg-white/5 overflow-hidden">
												<div 
													class="h-full {type === 'wins' ? 'bg-win shadow-[0_0_8px_rgba(0,255,136,0.4)]' : type === 'losses' ? 'bg-loss shadow-[0_0_8px_rgba(255,61,0,0.4)]' : 'bg-draw shadow-[0_0_8px_rgba(255,214,0,0.4)]'}"
													style="width: {((operativeStore.stats[type as keyof typeof operativeStore.stats] as number) / (operativeStore.totalGames || 1)) * 100}%"
												></div>
											</div>
										</div>
									{/each}
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
	:global(.glass-card) {
		background: rgba(15, 42, 53, 0.5);
		backdrop-filter: blur(8px);
		border-radius: 4px;
	}

	@keyframes scan {
		0% { transform: translateY(-100%); opacity: 0; }
		50% { opacity: 1; }
		100% { transform: translateY(100%); opacity: 0; }
	}
</style>
