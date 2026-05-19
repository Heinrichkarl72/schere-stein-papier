<script lang="ts">
	import { onMount } from 'svelte';
	import { Trophy, Target, Activity, TrendingUp, Info, AlertCircle, ChevronRight, Award, Zap, Shield, Star, BarChart3, Clock } from 'lucide-svelte';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { fade, fly } from 'svelte/transition';
	import { operativeStore } from '$lib/stores/operative.svelte';


	interface Player {
		rank: number;
		name: string;
		team: string;
		nation: string;
		badge: string;
		stats: { goals: number; assists: number; titles: string[] };
		metrics: { avgRating: number; bigGamePerf: number; intlImpact: number };
		trend: number[];
		probability?: number;
	}

	let players = $state<Player[]>([
		{
			rank: 1,
			name: 'Michael Olise',
			team: 'Bayern Munich',
			nation: 'France',
			badge: '🇫🇷',
			stats: { goals: 18, assists: 21, titles: ['Bundesliga (Leader)'] },
			metrics: { avgRating: 8.52, bigGamePerf: 9.6, intlImpact: 8.8 },
			trend: [65, 78, 88, 92, 95, 99]
		},
		{
			rank: 2,
			name: 'Harry Kane',
			team: 'Bayern Munich',
			nation: 'England',
			badge: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
			stats: { goals: 42, assists: 12, titles: ['Bundesliga (Leader)'] },
			metrics: { avgRating: 8.35, bigGamePerf: 8.2, intlImpact: 7.5 },
			trend: [88, 90, 92, 94, 95, 96]
		},
		{
			rank: 3,
			name: 'Lamine Yamal',
			team: 'FC Barcelona',
			nation: 'Spain',
			badge: '🇪🇸',
			stats: { goals: 16, assists: 18, titles: ['La Liga (Leader)'] },
			metrics: { avgRating: 8.42, bigGamePerf: 9.2, intlImpact: 9.5 },
			trend: [90, 92, 91, 93, 94, 96]
		},
		{
			rank: 4,
			name: 'Ousmane Dembélé',
			team: 'Paris Saint-Germain',
			nation: 'France',
			badge: '🇫🇷',
			stats: { goals: 14, assists: 24, titles: ['Ligue 1 (Leader)'] },
			metrics: { avgRating: 8.28, bigGamePerf: 8.8, intlImpact: 8.2 },
			trend: [70, 72, 80, 85, 90, 92]
		},
		{
			rank: 5,
			name: 'Erling Haaland',
			team: 'Manchester City',
			nation: 'Norway',
			badge: '🇳🇴',
			stats: { goals: 38, assists: 6, titles: ['Premier League (Target)'] },
			metrics: { avgRating: 8.15, bigGamePerf: 7.8, intlImpact: 6.5 },
			trend: [95, 98, 94, 92, 91, 88]
		}
	]);

	function calculateBallonDorChance(p: Player) {
		// 30% Titles & Team Success (2025/26 context)
		const leagueBonus = p.stats.titles.some(t => t.includes('Leader')) ? 40 : 20;
		const targetBonus = p.stats.titles.some(t => t.includes('Target')) ? 20 : 0;
		const titleScore = Math.min(100, leagueBonus + targetBonus + (p.stats.titles.length * 10));

		// 35% Individual Stats (Goals + Assists)
		const rawStats = p.stats.goals + p.stats.assists;
		const statsScore = (rawStats / 54) * 100; // Normalized to Kane's total (54)

		// 35% Consistency & Recent Form (Weighted by last 10 games trend)
		const recentForm = p.trend[p.trend.length - 1]; // Latest point in trend
		const ratingScore = ((p.metrics.avgRating - 7.0) / 1.5) * 100;
		const consistencyScore = (ratingScore * 0.6) + (recentForm * 0.4);

		// Combine with tighter normalization
		return (titleScore * 0.3) + (statsScore * 0.35) + (consistencyScore * 0.35);
	}

	let calculatedPlayers = $derived.by(() => {
		const withRaw = players.map((p) => ({ ...p, raw: calculateBallonDorChance(p) }));
		const totalRaw = withRaw.reduce((sum, p) => sum + p.raw, 0);
		return withRaw
			.map((p) => ({
				...p,
				probability: Math.round((p.raw / totalRaw) * 100)
			}))
			.sort((a, b) => (b.probability || 0) - (a.probability || 0))
			.map((p, i) => ({ ...p, rank: i + 1 }));
	});

	let lastUpdate = $state('');
	onMount(() => {
		lastUpdate = new Date().toLocaleString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		}).toUpperCase();
	});

	function getSparklinePoints(trend: number[]) {
		const width = 120;
		const height = 40;
		const max = 100;
		const min = 0;

		return trend
			.map((v, i) => {
				const x = (i / (trend.length - 1)) * width;
				const y = height - ((v - min) / (max - min)) * height;
				return `${x},${y}`;
			})
			.join(' ');
	}
</script>

<svelte:head>
	<title>ARENA.OPS | BALLON D'OR INTEL</title>
</svelte:head>


	<div class="flex flex-col h-screen bg-surface selection:bg-primary/20 selection:text-white">
		<Header />

		<main class="flex-1 flex overflow-hidden">
			<Sidebar />

			<!-- Intel Content -->
			<section class="flex-1 overflow-y-auto p-8 lg:p-12 relative" id="ballondor-main">
				<div class="w-full max-w-5xl mx-auto">
					<!-- ═══ Page Header ═══ -->
					<div class="flex items-end justify-between mb-12 border-b border-white/5 pb-8">
						<div>
							<div class="flex items-center gap-3 mb-2">
								<div class="px-2 py-0.5 bg-tertiary/10 border border-tertiary/30 rounded text-[10px] font-label font-bold text-tertiary tracking-widest uppercase">
									Classified Intelligence
								</div>
								<div class="flex items-center gap-2 text-white/30 text-[10px] font-label font-bold tracking-widest">
									<Clock size={12} />
									LAST UPDATE: {lastUpdate}
								</div>
							</div>
							<h1 class="text-4xl font-headline font-bold text-white tracking-wider flex items-center gap-4">
								<Trophy class="text-tertiary drop-shadow-[0_0_10px_rgba(255,214,0,0.5)]" size={36} />
								BALLON D'OR TRACKER
							</h1>
							<p class="text-primary font-label text-sm tracking-[0.2em] mt-2 italic uppercase">
								High-Value Target Analysis & Probability Matrix
							</p>
						</div>
					</div>

					<!-- ═══ Contenders List ═══ -->
					<div class="space-y-6">
						{#each calculatedPlayers as player, i}
							<div
								class="glass-heavy overflow-hidden border border-white/5 hover:border-primary/30 transition-all group relative"
								in:fly={{ y: 20, delay: i * 100, duration: 500 }}
							>
								<!-- Background ID Decor -->
								<div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
									<span class="text-8xl font-headline font-black tracking-tighter">#{player.rank}</span>
								</div>

								<div class="p-6 md:p-8 flex flex-col lg:flex-row gap-8 items-center lg:items-stretch">
									<!-- Rank Indicator -->
									<div class="flex-shrink-0 flex flex-col items-center justify-center w-16">
										<div class="text-4xl font-headline font-bold {player.rank === 1 ? 'text-tertiary text-glow-tertiary' : 'text-white/60'}">
											{player.rank.toString().padStart(2, '0')}
										</div>
										<div class="text-[9px] font-label font-bold text-white/30 tracking-[0.3em] uppercase mt-1">RANK</div>
									</div>

									<!-- Player Identity -->
									<div class="flex-shrink-0 w-32 h-32 rounded-sm bg-surface-lighter border border-white/10 p-4 flex flex-col items-center justify-center relative group-hover:border-primary/50 transition-colors">
										<span class="text-5xl mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{player.badge}</span>
										<div class="text-[10px] font-label font-bold text-white tracking-widest text-center truncate w-full uppercase">
											{player.nation}
										</div>
										{#if player.rank === 1}
											<div class="absolute -top-2 -right-2 w-6 h-6 bg-tertiary rounded-full flex items-center justify-center text-background shadow-[0_0_10px_rgba(255,214,0,0.5)]">
												<Star size={14} fill="currentColor" />
											</div>
										{/if}
									</div>

									<!-- Main Dossier Data -->
									<div class="flex-1 space-y-6">
										<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
											<div>
												<h2 class="text-2xl font-headline font-bold text-white group-hover:text-primary transition-colors tracking-wide uppercase">
													{player.name}
												</h2>
												<div class="flex items-center gap-2 text-white/40 text-xs font-label mt-1 uppercase tracking-widest">
													<Shield size={12} class="text-primary/60" />
													{player.team}
												</div>
											</div>
											<div class="text-right">
												<div class="text-[10px] font-label font-bold text-white/30 tracking-widest uppercase mb-1">Win Probability</div>
												<div class="text-3xl font-headline font-bold text-primary text-glow-primary">
													{player.probability}%
												</div>
											</div>
										</div>

										<!-- Probability Bar -->
										<div class="space-y-2">
											<div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
												<div
													class="h-full bg-gradient-to-r from-primary/50 to-primary shadow-[0_0_10px_rgba(0,255,255,0.3)] transition-all duration-1000 ease-out"
													style="width: {player.probability}%"
												></div>
											</div>
										</div>

										<!-- Tactical Stats Grid -->
										<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
											<div class="bg-white/5 p-3 border border-white/5 rounded-sm group-hover:bg-primary/5 transition-colors">
												<div class="text-[9px] font-label text-white/40 tracking-widest uppercase mb-1">Field Kills</div>
												<div class="text-lg font-headline font-bold text-white">{player.stats.goals} GOALS</div>
											</div>
											<div class="bg-white/5 p-3 border border-white/5 rounded-sm group-hover:bg-primary/5 transition-colors">
												<div class="text-[9px] font-label text-white/40 tracking-widest uppercase mb-1">Tactical Assists</div>
												<div class="text-lg font-headline font-bold text-white">{player.stats.assists} ASSISTS</div>
											</div>
											<div class="bg-white/5 p-3 border border-white/5 rounded-sm group-hover:bg-primary/5 transition-colors">
												<div class="text-[9px] font-label text-white/40 tracking-widest uppercase mb-1">Avg Efficiency</div>
												<div class="text-lg font-headline font-bold text-primary">{player.metrics.avgRating.toFixed(2)}</div>
											</div>
											<div class="bg-white/5 p-3 border border-white/5 rounded-sm group-hover:bg-primary/5 transition-colors">
												<div class="text-[9px] font-label text-white/40 tracking-widest uppercase mb-1">Performance Trend</div>
												<div class="h-6 mt-1">
													<svg width="100%" height="100%" viewBox="0 0 120 40" preserveAspectRatio="none">
														<path
															d="M {getSparklinePoints(player.trend)}"
															fill="none"
															stroke="currentColor"
															stroke-width="2"
															class="text-primary/40"
														/>
														<circle
															cx="120"
															cy={40 - (player.trend[player.trend.length - 1] / 100) * 40}
															r="3"
															fill="var(--color-primary)"
															class="animate-pulse shadow-[0_0_8px_var(--color-primary)]"
														/>
													</svg>
												</div>
											</div>
										</div>
									</div>

									<!-- High-Value Objectives -->
									<div class="flex-shrink-0 w-full lg:w-48 space-y-4">
										<div class="text-[10px] font-label font-bold text-white/30 tracking-widest uppercase border-b border-white/5 pb-2">
											Secured Objectives
										</div>
										<div class="space-y-2">
											{#each player.stats.titles as title}
												<div class="flex items-center gap-2 text-[10px] font-label font-bold text-win uppercase tracking-tighter">
													<Award size={12} />
													{title}
												</div>
											{/each}
											{#if player.stats.titles.length === 0}
												<div class="flex items-center gap-2 text-[10px] font-label font-bold text-white/20 uppercase italic">
													<AlertCircle size={12} />
													Pending...
												</div>
											{/if}
										</div>

										<div class="mt-6 pt-4 border-t border-white/5">
											<div class="flex justify-between items-center text-[9px] font-label font-bold tracking-widest uppercase mb-2">
												<span class="text-white/30">Target Impact</span>
												<span class="text-primary">{(player.metrics.bigGamePerf * 10).toFixed(0)}%</span>
											</div>
											<div class="w-full h-1 bg-white/5 rounded-full overflow-hidden">
												<div
													class="h-full bg-primary/40"
													style="width: {player.metrics.bigGamePerf * 10}%"
												></div>
											</div>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- ═══ Model Disclaimer ═══ -->
					<div class="mt-16 p-8 border border-white/5 bg-white/[0.02] rounded-sm">
						<div class="flex gap-4">
							<Info class="text-primary flex-shrink-0" size={20} />
							<div class="space-y-2">
								<h4 class="text-xs font-label font-bold text-white tracking-widest uppercase">Intelligence Parameters</h4>
								<p class="text-xs font-body text-white/40 leading-relaxed uppercase tracking-tight">
									Probabilities are generated via the <span class="text-primary">ARENA.OPS Matrix-V4</span> engine. Weights: 40% Team Success (International/Continental), 40% Field Operations (G/A), 20% Tactical Consistency (Season Avg). Data is subject to dynamic volatility based on upcoming engagement outcomes.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	</div>


<style>
	/* Custom styles for the tracking effect */
	#ballondor-main {
		scrollbar-width: thin;
		scrollbar-color: rgba(0, 255, 255, 0.1) transparent;
	}

	.text-glow-tertiary {
		text-shadow: 0 0 15px rgba(255, 214, 0, 0.4);
	}

	/* Simulated Scanning Line Animation */
	.group:hover::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 2px;
		background: linear-gradient(to right, transparent, var(--color-primary), transparent);
		animation: scan 2s linear infinite;
		opacity: 0.3;
	}

	@keyframes scan {
		0% { top: 0; }
		100% { top: 100%; }
	}
</style>
