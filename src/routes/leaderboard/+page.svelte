<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { operativeStore } from '$lib/stores/operative.svelte';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatsSidebar from '$lib/components/StatsSidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import OperativeAuth from '$lib/components/OperativeAuth.svelte';
	import { Trophy, Medal, User } from 'lucide-svelte';

	interface LeaderboardEntry {
		rank: number;
		callsign: string;
		wins: number;
		losses: number;
		isCurrentUser: boolean;
	}

	let leaderboard = $state<LeaderboardEntry[]>([]);
	let loading = $state(true);

	async function fetchLeaderboard() {
		loading = true;
		try {
			const { data, error } = await supabase
				.from('operative_stats')
				.select(`
					wins,
					losses,
					operatives (
						callsign
					)
				`)
				.order('wins', { ascending: false })
				.limit(10);

			if (error) throw error;

			leaderboard = (data || []).map((entry: any, index: number) => ({
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

	onMount(() => {
		if (operativeStore.isLoggedIn) {
			fetchLeaderboard();
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
											<tr class="group transition-colors {entry.isCurrentUser ? 'bg-primary/5' : 'hover:bg-white/[0.02]'}">
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
													{:else}
														<span class="text-[10px] font-label font-bold text-white/20 tracking-widest uppercase">OFFLINE</span>
													{/if}
												</td>
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
				</div>
			</section>

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
</style>
