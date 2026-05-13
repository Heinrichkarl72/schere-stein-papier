<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { operativeStore } from '$lib/stores/operative.svelte';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatsSidebar from '$lib/components/StatsSidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import OperativeAuth from '$lib/components/OperativeAuth.svelte';
	import { Trophy, Medal, User, X, AlertTriangle, CheckCircle2 } from 'lucide-svelte';

	interface LeaderboardEntry {
		id: string;
		rank: number;
		callsign: string;
		wins: number;
		losses: number;
		isCurrentUser: boolean;
		isTerminating?: boolean;
	}

	let leaderboard = $state<LeaderboardEntry[]>([]);
	let recruits = $state<LeaderboardEntry[]>([]);
	let loading = $state(true);
	let recruitsLoading = $state(true);
	let confirmingDelete = $state<string | null>(null);
	let purgeComplete = $state(false);

	const isAdmin = $derived(operativeStore.callsign === 'Aleks');

	async function fetchLeaderboard() {
		loading = true;
		try {
			const { data, error } = await supabase
				.from('operative_stats')
				.select(`
					wins,
					losses,
					operatives (
						id,
						callsign
					)
				`)
				.order('wins', { ascending: false })
				.limit(10);

			if (error) throw error;

			leaderboard = (data || []).map((entry: any, index: number) => ({
				id: entry.operatives?.id,
				rank: index + 1,
				callsign: entry.operatives?.callsign || 'UNKNOWN',
				wins: entry.wins,
				losses: entry.losses,
				isCurrentUser: entry.operatives?.callsign === operativeStore.callsign
			}));
		} catch (err) {
			console.error('Error fetching leaderboard:', err);
		} finally {
			loading = false;
		}
	}

	async function fetchRecruits() {
		recruitsLoading = true;
		try {
			const { data, error } = await supabase
				.from('operatives')
				.select(`
					id,
					callsign,
					created_at,
					operative_stats (
						wins,
						losses
					)
				`)
				.order('created_at', { ascending: false })
				.limit(5);

			if (error) throw error;

			recruits = (data || []).map((entry: any, index: number) => ({
				id: entry.id,
				rank: index + 1,
				callsign: entry.callsign || 'UNKNOWN',
				wins: entry.operative_stats?.[0]?.wins || 0,
				losses: entry.operative_stats?.[0]?.losses || 0,
				isCurrentUser: entry.callsign === operativeStore.callsign
			}));
		} catch (err) {
			console.error('Error fetching recruits:', err);
		} finally {
			recruitsLoading = false;
		}
	}

	async function handleTerminate(id: string) {
		// Admin Check Re-Verification
		if (operativeStore.callsign !== 'Aleks') {
			alert('ACCESS DENIED: INSUFFICIENT CLEARANCE.');
			return;
		}

		// Polish: Accidental Deletion Check
		if (!confirm('Are you sure you want to terminate this operative?')) return;

		const entry = [...leaderboard, ...recruits].find(e => e.id === id);
		if (!entry) return;
		
		try {
			// Visual feedback: Start glitch animation
			if (leaderboard.find(e => e.id === id)) {
				leaderboard = leaderboard.map(e => e.id === id ? { ...e, isTerminating: true } : e);
			}
			if (recruits.find(e => e.id === id)) {
				recruits = recruits.map(e => e.id === id ? { ...e, isTerminating: true } : e);
			}

			// Wait for tactical animation
			await new Promise(r => setTimeout(r, 800));

			// Permanent Removal from Supabase
			await supabase.from('game_sessions').delete().eq('operative_id', id);
			await supabase.from('operative_stats').delete().eq('operative_id', id);
			const { error } = await supabase.from('operatives').delete().eq('id', id);

			if (error) throw error;

			// Handle LocalStorage if deleting self (rare case but handled)
			if (entry.isCurrentUser) {
				operativeStore.logout();
				goto('/');
				return;
			}

			// Update State Immediately (Svelte Reactivity)
			leaderboard = leaderboard.filter(e => e.id !== id);
			recruits = recruits.filter(e => e.id !== id);

			// Feedback: Purge Complete Notification
			purgeComplete = true;
			setTimeout(() => { purgeComplete = false; }, 3000);

			confirmingDelete = null;
			
			// Auto-Navigation as requested
			await goto('/leaderboard', { invalidateAll: true });
		} catch (err) {
			console.error('Termination failed:', err);
			alert('TERMINATION SEQUENCE FAILED: AUTHORITY OVERRIDE REQUIRED.');
		}
	}

	onMount(() => {
		if (operativeStore.isLoggedIn) {
			fetchLeaderboard();
			fetchRecruits();
		}
	});
</script>

<svelte:head>
	<title>ARENA.OPS | LEADERBOARD</title>
</svelte:head>

{#if !operativeStore.isLoggedIn}
	<OperativeAuth />
{:else}
	<div class="flex flex-col h-screen bg-surface selection:bg-primary/20 selection:text-white">
		<Header />

		<main class="flex-1 flex overflow-hidden">
			<Sidebar />

			<!-- Leaderboard Content -->
			<section class="flex-1 overflow-y-auto p-12 flex flex-col items-center">
				<div class="w-full max-w-4xl">
					<div class="flex items-end justify-between mb-8 border-b border-white/5 pb-6">
						<div>
							<h1 class="text-4xl font-headline font-bold text-white tracking-wider flex items-center gap-4">
								<Trophy class="text-tertiary" size={36} />
								GLOBAL STANDINGS
							</h1>
							<p class="text-primary font-label text-sm tracking-[0.2em] mt-2 italic uppercase">
								Top Operatives in Active Combat
							</p>
						</div>
						<div class="text-right">
							<span class="text-white/30 text-[10px] font-label font-bold tracking-[0.2em] uppercase">Last Updated</span>
							<div class="text-white/60 font-headline text-sm">JUST NOW</div>
						</div>
					</div>

					<div class="glass-heavy w-full overflow-hidden">
						<div class="overflow-x-auto">
							<table class="w-full text-left border-collapse">
								<thead>
									<tr class="border-b border-white/10 bg-white/5">
										<th class="px-8 py-5 text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase">Rank</th>
										<th class="px-8 py-5 text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase">Operative</th>
										<th class="px-8 py-5 text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase text-center">Wins</th>
										<th class="px-8 py-5 text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase text-center">Losses</th>
										<th class="px-8 py-5 text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase text-right">Status</th>
										{#if isAdmin}
											<th class="px-4 py-5 text-[10px] font-label font-bold text-secondary tracking-[0.3em] uppercase text-center w-20">Admin</th>
										{/if}
									</tr>
								</thead>
								<tbody class="divide-y divide-white/5">
									{#if loading}
										{#each Array(5) as _}
											<tr class="animate-pulse">
												<td colspan="5" class="px-8 py-6 h-16 bg-white/5"></td>
											</tr>
										{/each}
									{:else}
										{#each leaderboard as entry}
											<tr class="group transition-all duration-500 {entry.isCurrentUser ? 'bg-primary/5' : 'hover:bg-white/[0.02]'} {entry.isTerminating ? 'glitch-out pointer-events-none' : ''}">
												<td class="px-8 py-6">
													<div class="flex items-center gap-3">
														{#if entry.rank === 1}
															<Trophy size={20} class="text-tertiary drop-shadow-[0_0_8px_rgba(255,214,0,0.6)]" />
															<span class="font-headline text-2xl font-bold text-tertiary drop-shadow-[0_0_10px_rgba(255,214,0,0.4)]">
																#{entry.rank}
															</span>
														{:else if entry.rank === 2}
															<Medal size={18} class="text-white/70" />
															<span class="font-headline text-xl font-bold text-white/70">#{entry.rank}</span>
														{:else if entry.rank === 3}
															<Medal size={18} class="text-secondary/70" />
															<span class="font-headline text-xl font-bold text-secondary/70">#{entry.rank}</span>
														{:else}
															<span class="font-headline text-lg font-bold text-white/30 ml-7">#{entry.rank}</span>
														{/if}
													</div>
												</td>
												<td class="px-8 py-6">
													<div class="flex items-center gap-4">
														<div class="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
															<img src="https://api.dicebear.com/7.x/bottts/svg?seed={entry.callsign}" alt="Avatar" class="w-full h-full object-cover" />
														</div>
														<div>
															<div class="font-label font-bold tracking-widest uppercase {entry.isCurrentUser ? 'text-primary text-glow-primary' : 'text-white'}">
																{entry.callsign}
															</div>
															<div class="text-[9px] text-white/30 uppercase tracking-[0.2em] mt-0.5">
																Level 0{11 - entry.rank} / Elite
															</div>
														</div>
													</div>
												</td>
												<td class="px-8 py-6 text-center">
													<span class="font-headline text-2xl font-bold text-primary">
														{entry.wins.toString().padStart(2, '0')}
													</span>
												</td>
												<td class="px-8 py-6 text-center">
													<span class="font-headline text-xl font-bold text-secondary/60">
														{entry.losses.toString().padStart(2, '0')}
													</span>
												</td>
												<td class="px-8 py-6 text-right">
													{#if entry.isCurrentUser}
														<span class="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-label font-bold text-primary tracking-widest uppercase">
															<div class="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
															YOU
														</span>
														<span class="text-[10px] font-label font-bold text-white/20 tracking-widest uppercase">OFFLINE</span>
													{/if}
												</td>
												{#if isAdmin}
													<td class="px-4 py-6 text-center">
														<button 
															onclick={() => confirmingDelete = entry.id}
															class="text-secondary/40 hover:text-secondary hover:scale-125 transition-all p-2 rounded-full hover:bg-secondary/10 group/terminate relative"
															title="TERMINATE OPERATIVE"
														>
															<X size={18} class="group-hover/terminate:drop-shadow-[0_0_8px_rgba(255,61,0,0.6)]" />
														</button>
													</td>
												{/if}
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
					</div>

					<div class="mt-8 flex justify-between items-center px-4">
						<p class="text-[10px] font-label text-white/40 tracking-[0.2em] uppercase">
							Showing Top 10 Operators in Sector 7G
						</p>
						<button class="text-primary hover:text-white transition-colors text-[10px] font-label font-bold tracking-[0.2em] uppercase flex items-center gap-2">
							View Full Roster
							<span class="text-lg">→</span>
						</button>
					</div>

					<!-- ═══ NEW RECRUITS SECTION ═══ -->
					<div class="mt-20 w-full" in:fade>
						<div class="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
							<h2 class="text-2xl font-headline font-bold text-white tracking-widest flex items-center gap-3">
								<User class="text-primary" size={24} />
								RECENT RECRUITS
							</h2>
							<div class="text-[9px] font-label font-bold text-white/20 tracking-[0.3em] uppercase">Sector 7G Admissions</div>
						</div>

						<div class="glass-heavy w-full overflow-hidden">
							<div class="overflow-x-auto">
								<table class="w-full text-left border-collapse">
									<thead>
										<tr class="border-b border-white/10 bg-white/5">
											<th class="px-8 py-5 text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase w-20">ID</th>
											<th class="px-8 py-5 text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase">Operative</th>
											<th class="px-8 py-5 text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase text-center">Wins</th>
											<th class="px-8 py-5 text-[10px] font-label font-bold text-primary tracking-[0.3em] uppercase text-right">Status</th>
											{#if isAdmin}
												<th class="px-4 py-5 text-[10px] font-label font-bold text-secondary tracking-[0.3em] uppercase text-center w-20">Admin</th>
											{/if}
										</tr>
									</thead>
									<tbody class="divide-y divide-white/5">
										{#if recruitsLoading}
											{#each Array(3) as _}
												<tr class="animate-pulse">
													<td colspan={isAdmin ? 5 : 4} class="px-8 py-6 h-16 bg-white/5"></td>
												</tr>
											{/each}
										{:else}
											{#each recruits as entry}
												<tr class="group transition-all duration-500 {entry.isCurrentUser ? 'bg-primary/5' : 'hover:bg-white/[0.02]'} {entry.isTerminating ? 'glitch-out pointer-events-none' : ''}">
													<td class="px-8 py-6 text-[10px] font-label font-bold text-white/20 uppercase tracking-widest">
														{entry.id.slice(0, 8)}...
													</td>
													<td class="px-8 py-6">
														<div class="flex items-center gap-4">
															<div class="w-10 h-10 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
																<img src="https://api.dicebear.com/7.x/bottts/svg?seed={entry.callsign}" alt="Avatar" class="w-full h-full object-cover" />
															</div>
															<div class="font-label font-bold tracking-widest uppercase {entry.isCurrentUser ? 'text-primary' : 'text-white'}">
																{entry.callsign}
															</div>
														</div>
													</td>
													<td class="px-8 py-6 text-center font-headline text-lg text-primary/60">
														{entry.wins.toString().padStart(2, '0')}
													</td>
													<td class="px-8 py-6 text-right">
														{#if entry.isCurrentUser}
															<span class="text-[9px] font-label font-bold text-primary uppercase">YOU</span>
														{:else}
															<span class="text-[9px] font-label font-bold text-white/10 uppercase">NEW UNIT</span>
														{/if}
													</td>
													{#if isAdmin}
														<td class="px-4 py-6 text-center">
															<button 
																onclick={() => confirmingDelete = entry.id}
																class="text-secondary/40 hover:text-secondary hover:scale-125 transition-all p-2 rounded-full hover:bg-secondary/10 group/terminate"
															>
																<X size={18} />
															</button>
														</td>
													{/if}
												</tr>
											{/each}
										{/if}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</section>

			{#if confirmingDelete}
				<div class="fixed inset-0 bg-surface/90 backdrop-blur-md z-50 flex items-center justify-center p-4" transition:fade>
					<div class="glass-heavy border-secondary/50 p-10 max-w-sm w-full text-center space-y-8 relative overflow-hidden">
						<!-- Danger Scanner -->
						<div class="absolute inset-0 bg-secondary/5 animate-pulse pointer-events-none"></div>
						
						<AlertTriangle class="text-secondary mx-auto animate-bounce" size={56} />
						
						<div class="space-y-3 relative z-10">
							<h3 class="text-2xl font-headline font-bold text-white uppercase tracking-[0.2em]">CONFIRM UNIT DELETION?</h3>
							<p class="text-[10px] font-label text-white/40 uppercase tracking-[0.2em] leading-relaxed">
								Executing this protocol will permanently erase the operative from the global registry. This action is irreversible.
							</p>
						</div>

						<div class="flex gap-4 relative z-10">
							<button 
								onclick={() => confirmingDelete = null}
								class="flex-1 py-4 border border-white/10 text-white font-label font-bold tracking-widest hover:bg-white/5 transition-all uppercase text-[10px]"
							>
								ABORT
							</button>
							<button 
								onclick={() => handleTerminate(confirmingDelete!)}
								class="flex-1 py-4 bg-secondary text-white font-label font-bold tracking-widest hover:bg-secondary-dim shadow-[0_0_20px_rgba(255,61,0,0.5)] transition-all uppercase text-[10px]"
							>
								TERMINATE
							</button>
						</div>
					</div>
				</div>
			{/if}

			{#if purgeComplete}
				<div class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-primary/10 border border-primary/30 backdrop-blur-xl rounded-sm shadow-[0_0_30px_rgba(0,255,255,0.2)]" in:fade out:fade>
					<CheckCircle2 class="text-primary" size={24} />
					<div class="flex flex-col">
						<span class="text-xs font-headline font-bold text-primary tracking-widest uppercase">Purge Complete</span>
						<span class="text-[9px] font-label text-white/40 uppercase tracking-widest">Unit de-registered from global standings</span>
					</div>
				</div>
			{/if}

			<StatsSidebar />
		</main>

		<Footer />
	</div>
{/if}

<style>
	table {
		background: rgba(19, 45, 56, 0.7);
		backdrop-filter: blur(12px);
	}

	.glitch-out {
		animation: glitch-fade 0.8s forwards;
		pointer-events: none;
	}

	@keyframes glitch-fade {
		0% { transform: translateX(0); opacity: 1; filter: hue-rotate(0deg); }
		20% { transform: translateX(-10px); filter: hue-rotate(90deg); }
		40% { transform: translateX(10px); opacity: 0.8; filter: hue-rotate(180deg); }
		60% { transform: translateX(-5px); opacity: 0.5; filter: hue-rotate(270deg); }
		80% { transform: translateX(5px); opacity: 0.2; }
		100% { transform: translateX(0); opacity: 0; scale: 0.9; }
	}
</style>
