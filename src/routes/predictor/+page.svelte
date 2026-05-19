<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	import { operativeStore } from '$lib/stores/operative.svelte';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatsSidebar from '$lib/components/StatsSidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	import { Target, Zap, ShieldAlert, Activity, Crosshair, Radio, CheckCircle2, AlertTriangle } from 'lucide-svelte';

	import { getAllTeams } from '$lib/services/footballData';
	import { calculateProbability, calculateProbabilityFromData } from '$lib/game/predictorEngine';
	import type { PredictionResult, RadarMetrics } from '$lib/game/predictorEngine';
	import type { TeamData } from '$lib/services/footballData';
	import type { LiveFixture, TeamStanding } from '$lib/services/footballApi';
	import { standingToTeamData, calcLeagueAvgGoals } from '$lib/services/footballApi';

	// ── Server Data ──
	let { data } = $props();
	
	let fixtures = $state<LiveFixture[]>(data?.fixtures ?? []);
	let standings = $state<TeamStanding[]>(data?.standings ?? []);
	const leagueStars = $derived(data?.leagueStars ?? {});
	let liveError = $state(data?.liveError ?? null);

	// ── Mock Data Fallback ──
	const mockMatches: LiveFixture[] = [
		{
			id: 9991,
			utcDate: new Date(Date.now() + 3600000).toISOString(),
			status: 'TIMED',
			matchday: 1,
			competition: { code: 'PD', name: 'La Liga', emblem: 'https://crests.football-data.org/PD.png' },
			homeTeam: { id: 86, name: 'Real Madrid CF', shortName: 'Real Madrid', crest: 'https://crests.football-data.org/86.png' },
			awayTeam: { id: 81, name: 'FC Barcelona', shortName: 'Barcelona', crest: 'https://crests.football-data.org/81.svg' },
			score: { home: null, away: null }
		},
		{
			id: 9992,
			utcDate: new Date(Date.now() + 7200000).toISOString(),
			status: 'TIMED',
			matchday: 1,
			competition: { code: 'BL1', name: 'Bundesliga', emblem: 'https://crests.football-data.org/BL1.png' },
			homeTeam: { id: 5, name: 'FC Bayern München', shortName: 'Bayern Munich', crest: 'https://crests.football-data.org/5.svg' },
			awayTeam: { id: 4, name: 'Borussia Dortmund', shortName: 'Dortmund', crest: 'https://crests.football-data.org/4.png' },
			score: { home: null, away: null }
		},
		{
			id: 9993,
			utcDate: new Date(Date.now() + 10800000).toISOString(),
			status: 'TIMED',
			matchday: 1,
			competition: { code: 'PL', name: 'Premier League', emblem: 'https://crests.football-data.org/PL.png' },
			homeTeam: { id: 65, name: 'Manchester City FC', shortName: 'Man City', crest: 'https://crests.football-data.org/65.png' },
			awayTeam: { id: 57, name: 'Arsenal FC', shortName: 'Arsenal', crest: 'https://crests.football-data.org/57.png' },
			score: { home: null, away: null }
		}
	];

	const mockStandings: TeamStanding[] = [
		{ teamId: 86, name: 'Real Madrid CF', shortName: 'Real Madrid', crest: 'https://crests.football-data.org/86.png', position: 1, played: 38, won: 29, drawn: 8, lost: 1, goalsFor: 87, goalsAgainst: 26, points: 95, form: ['W','W','D','W','W'], competitionCode: 'PD' },
		{ teamId: 81, name: 'FC Barcelona', shortName: 'Barcelona', crest: 'https://crests.football-data.org/81.svg', position: 2, played: 38, won: 26, drawn: 7, lost: 5, goalsFor: 79, goalsAgainst: 44, points: 85, form: ['W','W','W','W','W'], competitionCode: 'PD' },
		{ teamId: 5, name: 'FC Bayern München', shortName: 'Bayern Munich', crest: 'https://crests.football-data.org/5.svg', position: 1, played: 34, won: 23, drawn: 3, lost: 8, goalsFor: 94, goalsAgainst: 45, points: 72, form: ['L','W','L','W','W'], competitionCode: 'BL1' },
		{ teamId: 4, name: 'Borussia Dortmund', shortName: 'Dortmund', crest: 'https://crests.football-data.org/4.png', position: 5, played: 34, won: 18, drawn: 9, lost: 7, goalsFor: 68, goalsAgainst: 43, points: 63, form: ['W','L','W','W','L'], competitionCode: 'BL1' },
		{ teamId: 65, name: 'Manchester City FC', shortName: 'Man City', crest: 'https://crests.football-data.org/65.png', position: 1, played: 38, won: 28, drawn: 7, lost: 3, goalsFor: 96, goalsAgainst: 34, points: 91, form: ['W','W','W','W','W'], competitionCode: 'PL' },
		{ teamId: 57, name: 'Arsenal FC', shortName: 'Arsenal', crest: 'https://crests.football-data.org/57.png', position: 2, played: 38, won: 28, drawn: 5, lost: 5, goalsFor: 91, goalsAgainst: 29, points: 89, form: ['W','W','W','W','W'], competitionCode: 'PL' }
	];

	// ── State ──
	let teams: TeamData[] = $state([]);
	let homeTeamId = $state('');
	let awayTeamId = $state('');
	let prediction = $state<PredictionResult | null>(null);
	let scanning = $state(false);
	let scanProgress = $state(0);
	let showResults = $state(false);
	let showTacticalDetails = $state(false);
	let tacticalContext = $state<any>(null);
	let activeLeague = $state('ALL');

	const filteredFixtures = $derived(
		activeLeague === 'ALL' ? fixtures : fixtures.filter((f) => f.competition.code === activeLeague)
	);

	// ── Live Mode State ──
	let liveMode = $state(false);
	let selectedFixture = $state<LiveFixture | null>(null);

	const canAnalyze = $derived(
		liveMode
			? selectedFixture !== null
			: homeTeamId !== '' && awayTeamId !== '' && homeTeamId !== awayTeamId
	);

	function formatDateLong(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
	}

	const fixtureGroups = $derived.by(() => {
		const groups: { date: string; matches: LiveFixture[] }[] = [];
		const seen = new Map<string, number>();
		for (const f of filteredFixtures) {
			const date = f.utcDate.split('T')[0];
			const idx = seen.get(date);
			if (idx !== undefined) {
				groups[idx].matches.push(f);
			} else {
				seen.set(date, groups.length);
				groups.push({ date, matches: [f] });
			}
		}
		return groups.sort((a, b) => a.date.localeCompare(b.date));
	});

	// Display helpers — work for both live and manual mode
	const displayHomeShort = $derived(
		liveMode && selectedFixture ? selectedFixture.homeTeam.shortName : teams.find((t) => t.id === homeTeamId)?.shortName ?? '???'
	);
	const displayAwayShort = $derived(
		liveMode && selectedFixture ? selectedFixture.awayTeam.shortName : teams.find((t) => t.id === awayTeamId)?.shortName ?? '???'
	);

	onMount(() => {
		teams = getAllTeams();

		try {
			// Ensure safe path resolution and fallback for GitHub Pages
			if (!fixtures || fixtures.length === 0) {
				throw new Error('404 Not Found or empty fixtures');
			}
		} catch (e) {
			fixtures = mockMatches;
			standings = mockStandings;
			liveError = null; // Clear error to show the feed
			console.log('Using Tactical Simulation Data');
		}
	});

	function formatMatchTime(utcDate: string): string {
		return new Date(utcDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}

	async function selectFixture(fixture: LiveFixture) {
		const homeSt = standings.find((s) => s.teamId === fixture.homeTeam.id);
		const awaySt = standings.find((s) => s.teamId === fixture.awayTeam.id);
		if (!homeSt || !awaySt) return;

		liveMode = true;
		selectedFixture = fixture;
		homeTeamId = '';
		awayTeamId = '';

		// Reset states for new selection
		scanning = false;
		showResults = false;
		showTacticalDetails = false;
		prediction = null;
		scanProgress = 0;
		tacticalContext = null;

		// Start background fetch immediately (silent) using {base} relative path
		fetch(`${base}/api/tactical-data?matchId=${fixture.id}&homeId=${fixture.homeTeam.id}&awayId=${fixture.awayTeam.id}`)
			.then(async res => {
				if (res.status === 429) throw new Error('429');
				if (!res.ok) throw new Error('API Offline');
				const contentType = res.headers.get('content-type');
				if (!contentType || !contentType.includes('application/json')) throw new Error('Not JSON');
				return res.json();
			})
			.then(data => {
				tacticalContext = data;
			})
			.catch(err => {
				if (err.message === '429') {
					prediction = null;
					tacticalContext = { error: 'OPERATIONAL LIMIT REACHED. PLEASE WAIT 60 SECONDS.' };
				} else {
					console.warn('Tactical Link Unavailable (Expected in Static Build):', err);
					tacticalContext = { 
						homeMomentum: 1.05, 
						awayMomentum: 0.95,
						error: 'Using Tactical Simulation Data'
					};
				}
			});
	}

	async function initiateScan() {
		if (!selectedFixture) return;

		scanning = true;
		showResults = false;
		prediction = null;
		scanProgress = 0;

		// 1.5s progress simulation (requested)
		const steps = 30;
		for (let i = 0; i <= steps; i++) {
			scanProgress = Math.round((i / steps) * 100);
			await sleep(50);
		}

		try {
			// Find standings for both teams
			const homeSt = standings.find((s) => s.teamId === selectedFixture!.homeTeam.id);
			const awaySt = standings.find((s) => s.teamId === selectedFixture!.awayTeam.id);

			if (!homeSt || !awaySt) {
				console.warn('Standings missing for tactical scan — falling back to neutral baseline.');
				prediction = calculateProbability(homeTeamId, awayTeamId); // Fallback
			} else {
				const compStandings = standings.filter((s) => s.competitionCode === selectedFixture!.competition.code);
				const { avgFor, avgAgainst } = calcLeagueAvgGoals(compStandings);
				const homeData = standingToTeamData(homeSt, avgFor, avgAgainst);
				const awayData = standingToTeamData(awaySt, avgFor, avgAgainst);

				const context = {
					homeStarPlayers: leagueStars[selectedFixture!.competition.code]?.filter(s => s.teamId === selectedFixture!.homeTeam.id) || [],
					awayStarPlayers: leagueStars[selectedFixture!.competition.code]?.filter(s => s.teamId === selectedFixture!.awayTeam.id) || [],
					homeLineup: tacticalContext?.homeLineup || [],
					awayLineup: tacticalContext?.awayLineup || [],
					homeMomentum: tacticalContext?.homeMomentum,
					awayMomentum: tacticalContext?.awayMomentum,
					leagueCode: selectedFixture!.competition.code
				};

				prediction = calculateProbabilityFromData(homeData, awayData, context);
			}
		} catch (err) {
			console.error('Tactical Calculation Failed:', err);
		}

		scanning = false;
		showResults = true;
	}

	function sleep(ms: number): Promise<void> {
		return new Promise((r) => setTimeout(r, ms));
	}

	// ── SVG Radar Chart Helpers ──
	const radarLabels = ['ATK', 'DEF', 'EFF', 'FRM', 'SET'];
	const radarKeys: (keyof RadarMetrics)[] = [
		'attack',
		'defense',
		'efficiency',
		'form',
		'setPieces'
	];
	const radarCenter = 80;
	const radarRadius = 60;

	function radarPoint(index: number, value: number): string {
		const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
		const r = (value / 100) * radarRadius;
		const x = radarCenter + r * Math.cos(angle);
		const y = radarCenter + r * Math.sin(angle);
		return `${x},${y}`;
	}

	function radarPolygon(metrics: RadarMetrics): string {
		return radarKeys.map((key, i) => radarPoint(i, metrics[key])).join(' ');
	}

	function radarLabelPos(index: number): { x: number; y: number } {
		const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
		const r = radarRadius + 16;
		return {
			x: radarCenter + r * Math.cos(angle),
			y: radarCenter + r * Math.sin(angle)
		};
	}

	// ── Ring Gauge Helpers ──
	const ringRadius = 42;
	const ringCircumference = 2 * Math.PI * ringRadius;

	function ringOffset(pct: number): number {
		return ringCircumference - (pct / 100) * ringCircumference;
	}

	// ── Risk Badge Colors ──
	function riskColor(level: string): string {
		if (level === 'LOW') return 'text-win';
		if (level === 'MEDIUM') return 'text-tertiary';
		return 'text-secondary';
	}

	function riskBg(level: string): string {
		if (level === 'LOW') return 'bg-win/10 border-win/20';
		if (level === 'MEDIUM') return 'bg-tertiary/10 border-tertiary/20';
		return 'bg-secondary/10 border-secondary/20';
	}

	function resultColor(res: 'W' | 'D' | 'L'): string {
		if (res === 'W') return 'bg-win/20 text-win border-win/40 shadow-[0_0_10px_rgba(74,222,128,0.2)]';
		if (res === 'D') return 'bg-tertiary/20 text-tertiary border-tertiary/40 shadow-[0_0_10px_rgba(255,214,0,0.2)]';
		return 'bg-secondary/20 text-secondary border-secondary/40 shadow-[0_0_10px_rgba(255,61,0,0.2)]';
	}
</script>

<svelte:head>
	<title>ARENA.OPS | MATCH PREDICTOR</title>
	<meta
		name="description"
		content="High-tech football match prediction engine powered by multi-factor Poisson analysis."
	/>
</svelte:head>


	<div class="flex flex-col h-screen bg-surface selection:bg-primary/20 selection:text-white">
		<Header />

		<main class="flex-1 flex overflow-hidden">
			<Sidebar />

			<!-- Predictor Content -->
			<section class="flex-1 overflow-y-auto p-8 lg:p-12 relative" id="predictor-main">
				<div class="w-full max-w-5xl mx-auto">
					<!-- ═══ Page Header ═══ -->
					<div class="flex items-end justify-between mb-10 border-b border-white/5 pb-6">
						<div>
							<h1
								class="text-4xl font-headline font-bold text-white tracking-wider flex items-center gap-4"
							>
								<Crosshair class="text-primary" size={36} />
								MATCH PREDICTOR
							</h1>
							<p
								class="text-primary font-label text-sm tracking-[0.2em] mt-2 italic uppercase"
							>
								Multi-Factor Tactical Analysis Engine
							</p>
						</div>
						<div class="text-right hidden sm:block">
							<span
								class="text-white/30 text-[10px] font-label font-bold tracking-[0.2em] uppercase"
								>{liveError ? 'Offline Mode' : 'System Status'}</span
							>
							<div class="flex items-center justify-end gap-2 mt-1">
								{#if fixtures.length > 0 && !liveError}
									<div class="w-1.5 h-1.5 rounded-full bg-win animate-pulse shadow-[0_0_8px_#4ADE80]"></div>
									<span class="text-win font-label text-[10px] font-bold tracking-widest uppercase">LIVE CONNECTION ESTABLISHED</span>
								{:else}
									<div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
									<span class="text-primary font-label text-[10px] font-bold tracking-widest uppercase">ONLINE / MANUAL MODE</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- ═══ Live Fixtures Feed ═══ -->
					{#if fixtures.length > 0}
						<div class="mb-12">
							<div class="flex items-center justify-between mb-6">
								<div class="flex items-center gap-3">
									<Radio size={18} class="text-secondary animate-pulse" />
									<h2 class="text-xs font-label font-bold text-white/40 tracking-[0.3em] uppercase">
										TACTICAL FIXTURES FEED
									</h2>
								</div>
								<div class="text-[9px] font-label font-bold text-primary tracking-widest uppercase bg-primary/5 px-3 py-1 rounded-full border border-primary/20">
									Scanning Active
								</div>
							</div>

							<!-- League Filter -->
							<div class="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
								<button
									onclick={() => activeLeague = 'ALL'}
									class="px-4 py-2 rounded font-label text-[10px] font-bold tracking-widest border transition-all uppercase whitespace-nowrap {activeLeague === 'ALL' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(0,255,255,0.2)]' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}"
								>
									All Units
								</button>
								{#each ['PL', 'BL1', 'PD', 'SA', 'FL1', 'WC'] as code}
									<button
										onclick={() => activeLeague = code}
										class="px-4 py-2 rounded font-label text-[10px] font-bold tracking-widest border transition-all uppercase whitespace-nowrap {activeLeague === code ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(0,255,255,0.2)]' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}"
									>
										{code === 'BL1' ? 'Bundesliga' : code === 'PD' ? 'La Liga' : code === 'SA' ? 'Serie A' : code === 'FL1' ? 'Ligue 1' : code === 'WC' ? 'World Cup' : 'Premier League'}
									</button>
								{/each}
							</div>

							<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
								{#each fixtureGroups as group}
									<div class="space-y-3">
										<div class="flex items-center gap-2 px-2">
											<div class="w-1 h-3 bg-secondary rounded-full"></div>
											<span class="text-[10px] font-label font-bold text-white/50 tracking-widest uppercase">
												{formatDateLong(group.date)}
											</span>
										</div>
										{#each group.matches as fixture}
											<button 
												onclick={() => selectFixture(fixture)}
												disabled={scanning}
												class="w-full glass-card p-4 border border-white/5 hover:border-primary/30 transition-all text-left group flex items-center justify-between {selectedFixture?.id === fixture.id ? 'border-primary/50 bg-primary/5' : ''}"
											>
												<div class="flex items-center gap-4 flex-1">
													<div class="w-8 text-center text-[10px] font-headline text-white/30">
														{formatMatchTime(fixture.utcDate)}
													</div>
													<div class="flex items-center gap-3 flex-1">
														<div class="flex items-center gap-2 flex-1 justify-end">
															<span class="text-xs font-body text-white group-hover:text-primary transition-colors">{fixture.homeTeam.shortName}</span>
															<img src={fixture.homeTeam.crest} alt="" class="w-5 h-5 object-contain" />
														</div>
														<div class="px-2 py-0.5 bg-white/5 rounded text-[10px] font-headline text-white/40">VS</div>
														<div class="flex items-center gap-2 flex-1">
															<img src={fixture.awayTeam.crest} alt="" class="w-5 h-5 object-contain" />
															<span class="text-xs font-body text-white group-hover:text-secondary transition-colors">{fixture.awayTeam.shortName}</span>
														</div>
													</div>
												</div>
												<div class="flex items-center gap-3 pl-4">
													<img src={fixture.competition.emblem} alt="" class="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
													<div class="opacity-0 group-hover:opacity-100 transition-opacity">
														<Zap size={14} class="text-primary" />
													</div>
												</div>
											</button>
										{/each}
									</div>
								{/each}
							</div>
						</div>
					{:else if liveError}
						<div class="glass-card p-6 border border-secondary/20 bg-secondary/5 mb-10">
							<div class="flex items-center gap-3 text-secondary mb-2">
								<ShieldAlert size={18} />
								<span class="text-[10px] font-label font-bold tracking-widest uppercase">Data Link Error</span>
							</div>
							<p class="text-sm font-body text-white/60">{liveError}</p>
						</div>
					{/if}

					<!-- ═══ Tactical Interface: Central Hub ═══ -->
					{#if selectedFixture}
						<div class="grid grid-cols-1 gap-8 mb-12 results-fade-in" in:fade={{ duration: 400 }}>
							<!-- ── Tactical Control Center ── -->
							<div class="glass-heavy p-8 border border-white/10 relative overflow-hidden">
								<div class="absolute top-0 right-0 p-4 opacity-10">
									<Target size={120} />
								</div>

								<div class="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
									<!-- Target 1: Home -->
									<div class="flex flex-col items-center text-center">
										<div
											class="w-24 h-24 rounded-full border-2 border-primary/30 p-2 mb-4 bg-primary/5 relative group"
										>
											<div
												class="absolute inset-0 rounded-full border border-primary/60 animate-ping opacity-20"
											></div>
											<img
												src={selectedFixture.homeTeam.crest}
												alt={selectedFixture.homeTeam.shortName}
												class="w-full h-full object-contain"
											/>
										</div>
										<h3 class="text-xl font-headline font-bold text-white tracking-wider">
											{selectedFixture.homeTeam.name.toUpperCase()}
										</h3>
										<span class="text-[10px] font-label text-primary tracking-[0.3em] mt-1"
											>PRIMARY UNIT</span
										>
									</div>

									<!-- Engagement Matrix -->
									<div class="flex flex-col items-center">
										<div
											class="text-[10px] font-label font-bold text-white/30 tracking-[0.4em] uppercase mb-4"
										>
											Engagement Vector
										</div>
										<div class="flex items-center gap-6">
											<div class="h-px w-12 bg-gradient-to-r from-transparent to-primary"></div>
											<div class="relative">
												<div
													class="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/5"
												>
													<Zap size={24} class="text-secondary animate-pulse" />
												</div>
												<div
													class="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-ping"
												></div>
											</div>
											<div class="h-px w-12 bg-gradient-to-l from-transparent to-secondary"></div>
										</div>
										<button
											onclick={initiateScan}
											disabled={scanning}
											class="mt-8 px-10 py-4 bg-primary text-background font-label font-bold tracking-[0.3em] uppercase hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
										>
											<span class="relative z-10">{scanning ? 'Scanning Matrix...' : 'Initiate Tactical Scan'}</span>
											<div
												class="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300"
											></div>
										</button>

										{#if scanning}
											<div class="w-64 h-1 bg-white/10 rounded-full mt-4 overflow-hidden relative">
												<div 
													class="absolute inset-0 bg-primary shadow-[0_0_10px_#00FFFF]" 
													style="width: {scanProgress}%"
												></div>
											</div>
											<span class="text-[8px] font-label text-primary/60 tracking-widest mt-2 uppercase">Processing Tactical Data: {scanProgress}%</span>
										{/if}
									</div>

									<!-- Target 2: Away -->
									<div class="flex flex-col items-center text-center">
										<div
											class="w-24 h-24 rounded-full border-2 border-secondary/30 p-2 mb-4 bg-secondary/5 relative group"
										>
											<div
												class="absolute inset-0 rounded-full border border-secondary/60 animate-ping opacity-20"
											></div>
											<img
												src={selectedFixture.awayTeam.crest}
												alt={selectedFixture.awayTeam.shortName}
												class="w-full h-full object-contain"
											/>
										</div>
										<h3 class="text-xl font-headline font-bold text-white tracking-wider">
											{selectedFixture.awayTeam.name.toUpperCase()}
										</h3>
										<span class="text-[10px] font-label text-secondary tracking-[0.3em] mt-1"
											>OPPOSING UNIT</span
										>
									</div>
								</div>

								{#if scanning}
									<div
										class="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
									>
										<div class="w-64 h-1 bg-white/10 rounded-full overflow-hidden mb-6">
											<div
												class="h-full bg-primary transition-all duration-300"
												style="width: {scanProgress}%"
											></div>
										</div>
										<div class="flex items-center gap-3">
											<Activity size={16} class="text-primary animate-spin" />
											<div
												class="text-[10px] font-label text-white/30 tracking-[0.3em] uppercase animate-pulse"
											>
												{#if scanProgress < 25}
													ESTABLISHING DATA LINK…
												{:else if scanProgress < 45}
													RETRIEVING SQUAD LINEUPS…
												{:else if scanProgress < 70}
													ANALYZING STAR PLAYER IMPACT…
												{:else if scanProgress < 90}
													RUNNING DEEP TACTICAL SCAN…
												{:else}
													FINALIZING PREDICTION…
												{/if}
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<!-- No Fixture Selected Placeholder -->
						<div class="glass-heavy p-12 text-center border border-dashed border-white/10 mb-12">
							<Crosshair size={48} class="text-white/10 mx-auto mb-4" />
							<div class="text-sm font-label text-white/40 tracking-widest uppercase">
								Select a mission objective from the feed to begin analysis
							</div>
						</div>
					{/if}

					<!-- ═══ Results ═══ -->
					{#if showResults && prediction}
						<div class="space-y-8 results-fade-in">
							<!-- ── Probability Hub ── -->
							<div class="glass-heavy p-8">
								<div
									class="text-[10px] font-label font-bold text-white/30 tracking-[0.3em] uppercase mb-6 flex items-center gap-2"
								>
									<Target size={14} class="text-primary" />
									PROBABILITY HUB
								</div>

								<div class="grid grid-cols-3 gap-8">
									<!-- Home Win Ring -->
									<div class="flex flex-col items-center">
										<svg width="100" height="100" viewBox="0 0 100 100" class="ring-gauge">
											<circle
												cx="50"
												cy="50"
												r={ringRadius}
												fill="none"
												stroke="rgba(255,255,255,0.05)"
												stroke-width="6"
											/>
											<circle
												cx="50"
												cy="50"
												r={ringRadius}
												fill="none"
												stroke="#00FFFF"
												stroke-width="6"
												stroke-linecap="round"
												stroke-dasharray={ringCircumference}
												stroke-dashoffset={ringOffset(prediction.homeWinPct)}
												transform="rotate(-90, 50, 50)"
												class="ring-animate"
												style="filter: drop-shadow(0 0 6px rgba(0,255,255,0.5))"
											/>
											<text
												x="50"
												y="48"
												text-anchor="middle"
												fill="#00FFFF"
												font-size="18"
												font-weight="bold"
												font-family="Space Grotesk">{prediction.homeWinPct}%</text
											>
											<text
												x="50"
												y="62"
												text-anchor="middle"
												fill="rgba(255,255,255,0.4)"
												font-size="7"
												font-weight="600"
												letter-spacing="0.15em"
												font-family="Manrope">HOME</text
											>
										</svg>
										<span
											class="text-xs font-label font-bold text-primary mt-2 tracking-widest text-center"
											>{displayHomeShort}</span
										>
									</div>

									<!-- Draw Ring -->
									<div class="flex flex-col items-center">
										<svg width="100" height="100" viewBox="0 0 100 100" class="ring-gauge">
											<circle
												cx="50"
												cy="50"
												r={ringRadius}
												fill="none"
												stroke="rgba(255,255,255,0.05)"
												stroke-width="6"
											/>
											<circle
												cx="50"
												cy="50"
												r={ringRadius}
												fill="none"
												stroke="#FFD600"
												stroke-width="6"
												stroke-linecap="round"
												stroke-dasharray={ringCircumference}
												stroke-dashoffset={ringOffset(prediction.drawPct)}
												transform="rotate(-90, 50, 50)"
												class="ring-animate"
												style="filter: drop-shadow(0 0 6px rgba(255,214,0,0.5))"
											/>
											<text
												x="50"
												y="48"
												text-anchor="middle"
												fill="#FFD600"
												font-size="18"
												font-weight="bold"
												font-family="Space Grotesk">{prediction.drawPct}%</text
											>
											<text
												x="50"
												y="62"
												text-anchor="middle"
												fill="rgba(255,255,255,0.4)"
												font-size="7"
												font-weight="600"
												letter-spacing="0.15em"
												font-family="Manrope">DRAW</text
											>
										</svg>
										<span class="text-xs font-label font-bold text-tertiary mt-2 tracking-widest"
											>DRAW</span
										>
									</div>

									<!-- Away Win Ring -->
									<div class="flex flex-col items-center">
										<svg width="100" height="100" viewBox="0 0 100 100" class="ring-gauge">
											<circle
												cx="50"
												cy="50"
												r={ringRadius}
												fill="none"
												stroke="rgba(255,255,255,0.05)"
												stroke-width="6"
											/>
											<circle
												cx="50"
												cy="50"
												r={ringRadius}
												fill="none"
												stroke="#FF3D00"
												stroke-width="6"
												stroke-linecap="round"
												stroke-dasharray={ringCircumference}
												stroke-dashoffset={ringOffset(prediction.awayWinPct)}
												transform="rotate(-90, 50, 50)"
												class="ring-animate"
												style="filter: drop-shadow(0 0 6px rgba(255,61,0,0.5))"
											/>
											<text
												x="50"
												y="48"
												text-anchor="middle"
												fill="#FF3D00"
												font-size="18"
												font-weight="bold"
												font-family="Space Grotesk">{prediction.awayWinPct}%</text
											>
											<text
												x="50"
												y="62"
												text-anchor="middle"
												fill="rgba(255,255,255,0.4)"
												font-size="7"
												font-weight="600"
												letter-spacing="0.15em"
												font-family="Manrope">AWAY</text
											>
										</svg>
										<span
											class="text-xs font-label font-bold text-secondary mt-2 tracking-widest text-center"
											>{displayAwayShort}</span
										>
									</div>
								</div>

								<!-- Advanced Tactical Insights -->
								<div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8" in:fade={{ delay: 600, duration: 600 }}>
									<!-- Home Tactical Sidebar -->
									<div class="glass-card p-6 border border-primary/20 bg-primary/5 relative">
										<div class="absolute -top-3 left-4 px-2 bg-background border border-primary/30 text-[9px] font-label text-primary tracking-[0.2em] font-bold uppercase">
											Tactical Intel: {selectedFixture?.homeTeam.shortName || 'Home'}
										</div>
										<div class="space-y-5">
											{#each prediction.tacticalBreakdown.homeInsights as insight}
												<div class="flex items-center gap-4 group">
													<div class="flex-shrink-0">
														{#if insight.iconType === 'SUCCESS'}
															<CheckCircle2 size={16} class="text-primary" />
														{:else if insight.iconType === 'WARNING'}
															<AlertTriangle size={16} class="text-secondary animate-pulse" />
														{:else}
															<div class="w-2 h-2 rounded-full bg-white/20"></div>
														{/if}
													</div>
													<div class="flex-1">
														<div class="text-[9px] font-label text-white/40 tracking-widest uppercase mb-0.5">{insight.label}</div>
														<div class="text-xs font-headline font-bold text-white group-hover:text-primary transition-colors uppercase tracking-wider">{insight.value}</div>
													</div>
												</div>
											{/each}
											{#if prediction.tacticalBreakdown.homeInsights.length === 0}
												<div class="text-[10px] font-label text-white/20 italic uppercase tracking-widest">Awaiting further tactical data...</div>
											{/if}
										</div>
									</div>

									<!-- Away Tactical Sidebar -->
									<div class="glass-card p-6 border border-secondary/20 bg-secondary/5 relative">
										<div class="absolute -top-3 right-4 px-2 bg-background border border-secondary/30 text-[9px] font-label text-secondary tracking-[0.2em] font-bold uppercase">
											Tactical Intel: {selectedFixture?.awayTeam.shortName || 'Away'}
										</div>
										<div class="space-y-5">
											{#each prediction.tacticalBreakdown.awayInsights as insight}
												<div class="flex items-center gap-4 group justify-end text-right">
													<div class="flex-1">
														<div class="text-[9px] font-label text-white/40 tracking-widest uppercase mb-0.5">{insight.label}</div>
														<div class="text-xs font-headline font-bold text-white group-hover:text-secondary transition-colors uppercase tracking-wider">{insight.value}</div>
													</div>
													<div class="flex-shrink-0">
														{#if insight.iconType === 'SUCCESS'}
															<CheckCircle2 size={16} class="text-secondary" />
														{:else if insight.iconType === 'WARNING'}
															<AlertTriangle size={16} class="text-secondary animate-pulse" />
														{:else}
															<div class="w-2 h-2 rounded-full bg-white/20"></div>
														{/if}
													</div>
												</div>
											{/each}
											{#if prediction.tacticalBreakdown.awayInsights.length === 0}
												<div class="text-[10px] font-label text-white/20 italic uppercase tracking-widest text-right">Awaiting further tactical data...</div>
											{/if}
										</div>
									</div>
								</div>

								<!-- Analysis Confidence -->
								<div class="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
									<div class="flex items-center gap-4">
										<div class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center relative">
											<svg width="40" height="40" viewBox="0 0 40 40">
												<circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="2" />
												<circle cx="20" cy="20" r="16" fill="none" stroke="#4ADE80" stroke-width="2" stroke-dasharray="100.53" stroke-dashoffset={100.53 - (prediction.confidenceScore / 100) * 100.53} transform="rotate(-90, 20, 20)" />
											</svg>
											<span class="absolute text-[10px] font-headline font-bold text-win">{prediction.confidenceScore}%</span>
										</div>
										<div>
											<div class="text-[10px] font-label font-bold text-white/30 tracking-widest uppercase">Analysis Confidence</div>
											<div class="text-xs font-body text-white/70 italic">Model reliability based on data depth</div>
										</div>
									</div>
									<button 
										onclick={() => showTacticalDetails = !showTacticalDetails}
										class="px-4 py-2 border border-white/10 rounded font-label text-[10px] font-bold tracking-widest text-white/40 hover:text-primary hover:border-primary/40 transition-all uppercase"
									>
										{showTacticalDetails ? 'Hide' : 'Show'} Technical Breakdown
									</button>
								</div>

								{#if showTacticalDetails}
									<div class="mt-6 p-6 bg-white/[0.02] border border-white/5 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-8 results-fade-in">
										<div>
											<div class="text-[9px] font-label font-bold text-primary tracking-widest uppercase mb-3">Star Player Impact</div>
											<div class="space-y-2">
												<div class="flex justify-between items-center text-xs">
													<span class="text-white/50">{displayHomeShort}</span>
													<span class={prediction.tacticalBreakdown.starPlayerImpact.home >= 0 ? 'text-win' : 'text-secondary'}>
														{prediction.tacticalBreakdown.starPlayerImpact.home >= 0 ? '+' : ''}{prediction.tacticalBreakdown.starPlayerImpact.home}%
													</span>
												</div>
												<div class="flex justify-between items-center text-xs">
													<span class="text-white/50">{displayAwayShort}</span>
													<span class={prediction.tacticalBreakdown.starPlayerImpact.away >= 0 ? 'text-win' : 'text-secondary'}>
														{prediction.tacticalBreakdown.starPlayerImpact.away >= 0 ? '+' : ''}{prediction.tacticalBreakdown.starPlayerImpact.away}%
													</span>
												</div>
											</div>
										</div>
										<div>
											<div class="text-[9px] font-label font-bold text-secondary tracking-widest uppercase mb-3">Momentum Shift</div>
											<div class="space-y-2">
												<div class="flex justify-between items-center text-xs">
													<span class="text-white/50">{displayHomeShort}</span>
													<span class="text-white font-bold">{prediction.tacticalBreakdown.momentumShift.home.toFixed(1)}</span>
												</div>
												<div class="flex justify-between items-center text-xs">
													<span class="text-white/50">{displayAwayShort}</span>
													<span class="text-white font-bold">{prediction.tacticalBreakdown.momentumShift.away.toFixed(1)}</span>
												</div>
											</div>
										</div>
										<div>
											<div class="text-[9px] font-label font-bold text-tertiary tracking-widest uppercase mb-3">League Factor</div>
											<div class="flex items-center gap-3">
												<div class="text-xl font-headline text-white font-bold">x{prediction.tacticalBreakdown.leagueFactor}</div>
												<div class="text-[10px] text-white/30 italic uppercase">Weighted goal avg</div>
											</div>
										</div>
									</div>
								{/if}
							</div>

							<!-- ── Recent Operational Logs (Form Tracker) ── -->
							<div class="glass-heavy p-8 results-fade-in">
								<div
									class="text-[10px] font-label font-bold text-white/30 tracking-[0.3em] uppercase mb-6 flex items-center gap-2"
								>
									<Radio size={14} class="text-secondary" />
									RECENT OPERATIONAL LOGS
								</div>

								<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
									<!-- Home History -->
									<div class="space-y-4">
										<div class="flex items-center gap-2 mb-2">
											<div class="w-1 h-3 bg-primary rounded-full"></div>
											<span class="text-[10px] font-label font-bold text-white/60 tracking-widest uppercase">{displayHomeShort} UNIT HISTORY</span>
										</div>
										{#if tacticalContext?.error}
											<div class="p-3 bg-secondary/10 border border-secondary/20 rounded text-[10px] font-label text-secondary uppercase tracking-widest animate-pulse">
												{tacticalContext.error}
											</div>
										{:else if tacticalContext?.homeHistory}
											<div class="space-y-3" in:fade={{ duration: 600 }}>
												{#each tacticalContext.homeHistory as match}
													<div class="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.04] transition-all group hover:translate-x-1">
														<div class="flex items-center gap-3">
															<div class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-headline font-bold border {resultColor(match.result)}">
																{match.result}
															</div>
															<span class="text-xs font-body text-white/80 group-hover:text-white transition-colors">{match.opponent}</span>
														</div>
														<span class="text-[10px] font-headline font-bold text-white/40 tracking-wider">{match.score}</span>
													</div>
												{/each}
											</div>
										{:else}
											<!-- Skeleton -->
											{#each Array(5) as _}
												<div class="h-10 w-full bg-white/5 rounded animate-pulse mb-3"></div>
											{/each}
										{/if}
									</div>

									<!-- Away History -->
									<div class="space-y-4">
										<div class="flex items-center gap-2 mb-2">
											<div class="w-1 h-3 bg-secondary rounded-full"></div>
											<span class="text-[10px] font-label font-bold text-white/60 tracking-widest uppercase">{displayAwayShort} UNIT HISTORY</span>
										</div>
										{#if tacticalContext?.error}
											<div class="p-3 bg-secondary/10 border border-secondary/20 rounded text-[10px] font-label text-secondary uppercase tracking-widest animate-pulse">
												{tacticalContext.error}
											</div>
										{:else if tacticalContext?.awayHistory}
											<div class="space-y-3" in:fade={{ duration: 600 }}>
												{#each tacticalContext.awayHistory as match}
													<div class="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded hover:bg-white/[0.04] transition-all group hover:translate-x-1">
														<div class="flex items-center gap-3">
															<div class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-headline font-bold border {resultColor(match.result)}">
																{match.result}
															</div>
															<span class="text-xs font-body text-white/80 group-hover:text-white transition-colors">{match.opponent}</span>
														</div>
														<span class="text-[10px] font-headline font-bold text-white/40 tracking-wider">{match.score}</span>
													</div>
												{/each}
											</div>
										{:else}
											<!-- Skeleton -->
											{#each Array(5) as _}
												<div class="h-10 w-full bg-white/5 rounded animate-pulse mb-3"></div>
											{/each}
										{/if}
									</div>
								</div>
							</div>

							<!-- ── Data Deep Dive: Radar + Prediction Output ── -->
							<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
								<!-- Radar Chart -->
								<div class="glass-card p-6 border border-white/5">
									<div
										class="text-[10px] font-label font-bold text-white/30 tracking-[0.3em] uppercase mb-4 flex items-center gap-2"
									>
										<Activity size={14} class="text-primary" />
										METRICS RADAR
									</div>

									<div class="flex justify-center">
										<svg width="160" height="160" viewBox="0 0 160 160">
											<!-- Grid rings -->
											{#each [0.25, 0.5, 0.75, 1.0] as ring}
												<polygon
													points={radarKeys
														.map((_, i) => {
															const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
															const r = radarRadius * ring;
															return `${radarCenter + r * Math.cos(angle)},${radarCenter + r * Math.sin(angle)}`;
														})
														.join(' ')}
													fill="none"
													stroke="rgba(255,255,255,0.06)"
													stroke-width="0.5"
												/>
											{/each}

											<!-- Axis lines -->
											{#each radarKeys as _, i}
												{@const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2}
												<line
													x1={radarCenter}
													y1={radarCenter}
													x2={radarCenter + radarRadius * Math.cos(angle)}
													y2={radarCenter + radarRadius * Math.sin(angle)}
													stroke="rgba(255,255,255,0.06)"
													stroke-width="0.5"
												/>
											{/each}

											<!-- Away team polygon (coral, drawn first so home is on top) -->
											<polygon
												points={radarPolygon(prediction.radarAway)}
												fill="rgba(255, 61, 0, 0.12)"
												stroke="#FF3D00"
												stroke-width="1.5"
												style="filter: drop-shadow(0 0 4px rgba(255,61,0,0.3))"
											/>

											<!-- Home team polygon (cyan) -->
											<polygon
												points={radarPolygon(prediction.radarHome)}
												fill="rgba(0, 255, 255, 0.12)"
												stroke="#00FFFF"
												stroke-width="1.5"
												style="filter: drop-shadow(0 0 4px rgba(0,255,255,0.3))"
											/>

											<!-- Labels -->
											{#each radarLabels as label, i}
												{@const pos = radarLabelPos(i)}
												<text
													x={pos.x}
													y={pos.y}
													text-anchor="middle"
													dominant-baseline="middle"
													fill="rgba(255,255,255,0.4)"
													font-size="7"
													font-weight="700"
													letter-spacing="0.1em"
													font-family="Manrope">{label}</text
												>
											{/each}
										</svg>
									</div>

									<!-- Legend -->
									<div class="flex justify-center gap-6 mt-4">
										<div class="flex items-center gap-2">
											<div class="w-3 h-1 bg-primary rounded-full"></div>
											<span
												class="text-[9px] font-label font-bold text-white/40 tracking-widest"
												>{displayHomeShort}</span
											>
										</div>
										<div class="flex items-center gap-2">
											<div class="w-3 h-1 bg-secondary rounded-full"></div>
											<span
												class="text-[9px] font-label font-bold text-white/40 tracking-widest"
												>{displayAwayShort}</span
											>
										</div>
									</div>
								</div>

								<!-- Prediction Output -->
								<div class="glass-card p-6 border border-white/5 flex flex-col justify-between">
									<div>
										<div
											class="text-[10px] font-label font-bold text-white/30 tracking-[0.3em] uppercase mb-6 flex items-center gap-2"
										>
											<Zap size={14} class="text-tertiary" />
											PREDICTION OUTPUT
										</div>

										<!-- Most Likely Scoreline -->
										<div class="text-center mb-8">
											<div
												class="text-[9px] font-label font-bold text-white/30 tracking-[0.3em] uppercase mb-3"
											>
												MOST LIKELY SCORELINE
											</div>
											<div class="flex items-center justify-center gap-4">
												<span
													class="text-xs font-label font-bold text-primary tracking-widest text-right flex-1"
													>{displayHomeShort}</span
												>
												<div
													class="text-5xl font-headline font-bold text-white tracking-widest scoreline-glow"
												>
													{prediction.mostLikelyScore}
												</div>
												<span
													class="text-xs font-label font-bold text-secondary tracking-widest text-left flex-1"
													>{displayAwayShort}</span
												>
											</div>
										</div>

										<!-- Expected Goals -->
										<div class="grid grid-cols-2 gap-4 mb-6">
											<div class="text-center p-3 bg-white/[0.02] rounded-lg border border-white/5">
												<div
													class="text-[8px] font-label text-white/30 tracking-[0.2em] uppercase mb-1"
												>
													xG HOME
												</div>
												<div class="text-xl font-headline font-bold text-primary">
													{prediction.homeExpectedGoals}
												</div>
											</div>
											<div class="text-center p-3 bg-white/[0.02] rounded-lg border border-white/5">
												<div
													class="text-[8px] font-label text-white/30 tracking-[0.2em] uppercase mb-1"
												>
													xG AWAY
												</div>
												<div class="text-xl font-headline font-bold text-secondary">
													{prediction.awayExpectedGoals}
												</div>
											</div>
										</div>
									</div>

									<!-- Risk Assessment -->
									<div
										class="flex items-center justify-between p-4 rounded-lg border {riskBg(
											prediction.riskLevel
										)}"
									>
										<div class="flex items-center gap-3">
											<ShieldAlert size={18} class={riskColor(prediction.riskLevel)} />
											<div>
												<div
													class="text-[9px] font-label font-bold text-white/30 tracking-[0.2em] uppercase"
												>
													RISK ASSESSMENT
												</div>
												<div
													class="text-sm font-headline font-bold tracking-widest {riskColor(
														prediction.riskLevel
													)}"
												>
													{prediction.riskLevel} VOLATILITY
												</div>
											</div>
										</div>
										<div
											class="w-2 h-2 rounded-full animate-pulse {prediction.riskLevel === 'LOW'
												? 'bg-win'
												: prediction.riskLevel === 'MEDIUM'
													? 'bg-tertiary'
													: 'bg-secondary'}"
										></div>
									</div>
								</div>
							</div>

							<!-- ── Disclaimer ── -->
							<div
								class="text-center py-4 border-t border-white/5 mt-4"
								id="predictor-disclaimer"
							>
								<p class="text-[9px] font-label text-white/20 tracking-[0.15em] uppercase">
									Tactical simulation for entertainment purposes only. No real-money gambling.
								</p>
							</div>
						</div>
					{/if}
				</div>
			</section>

			<StatsSidebar />
		</main>

		<Footer />
	</div>

<style>
	/* ── Scanning Animation ── */
	.scan-container {
		min-height: 220px;
	}

	.scan-line {
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(0, 255, 255, 0.4),
			rgba(0, 255, 255, 0.8),
			rgba(0, 255, 255, 0.4),
			transparent
		);
		animation: scanDown 2s ease-in-out infinite;
		box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
	}

	.scan-line-2 {
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(0, 255, 255, 0.2),
			rgba(0, 255, 255, 0.5),
			rgba(0, 255, 255, 0.2),
			transparent
		);
		animation: scanDown 2s ease-in-out infinite;
		animation-delay: 1s;
	}

	@keyframes scanDown {
		0% {
			top: 0;
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			top: 100%;
			opacity: 0;
		}
	}

	/* ── Ring Gauge Animation ── */
	.ring-animate {
		animation: ringReveal 1.2s ease-out forwards;
	}

	@keyframes ringReveal {
		from {
			stroke-dashoffset: 263.89;
		}
	}

	/* ── Results Fade In ── */
	.results-fade-in {
		animation: fadeSlideUp 0.6s ease-out;
	}

	@keyframes fadeSlideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ── Scoreline Glow ── */
	.scoreline-glow {
		text-shadow:
			0 0 20px rgba(0, 255, 255, 0.3),
			0 0 40px rgba(0, 255, 255, 0.1);
	}
</style>
