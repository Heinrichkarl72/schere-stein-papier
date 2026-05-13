<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { 
		Dices, 
		Shield, 
		Zap, 
		RefreshCw, 
		Terminal, 
		Activity, 
		AlertTriangle, 
		CheckCircle2, 
		Coins,
		ChevronRight,
		Clock,
		History,
		GripVertical
	} from 'lucide-svelte';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatsSidebar from '$lib/components/StatsSidebar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import OperativeAuth from '$lib/components/OperativeAuth.svelte';
	import { operativeStore } from '$lib/stores/operative.svelte';

	// ═══ TYPES ═══
	type Suit = '♠' | '♣' | '♥' | '♦';
	type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
	interface Card {
		rank: Rank;
		suit: Suit;
		hidden?: boolean;
	}

	// ═══ STATE ═══
	let deck = $state<Card[]>([]);
	let playerHand = $state<Card[]>([]);
	let dealerHand = $state<Card[]>([]);
	let credits = $state(1000);
	let currentBet = $state(100);
	let gameStatus = $state<'BETTING' | 'PLAYING' | 'DEALER_TURN' | 'RESULT'>('BETTING');
	let resultMessage = $state('');
	let resultType = $state<'WIN' | 'LOSS' | 'PUSH' | 'BUST'>('WIN');
	let log = $state<string[]>([]);
	let stats = $state({ wins: 0, losses: 0, operations: 0 });

	// ═══ LOGIC ═══
	const createDeck = () => {
		const suits: Suit[] = ['♠', '♣', '♥', '♦'];
		const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
		const newDeck: Card[] = [];
		for (const suit of suits) {
			for (const rank of ranks) {
				newDeck.push({ rank, suit });
			}
		}
		return newDeck;
	};

	const shuffle = (deck: Card[]) => {
		const shuffled = [...deck];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	};

	const getCardValue = (rank: Rank) => {
		if (rank === 'A') return 11;
		if (['J', 'Q', 'K'].includes(rank)) return 10;
		return parseInt(rank);
	};

	const calculateTotal = (hand: Card[]) => {
		let total = 0;
		let aces = 0;
		for (const card of hand) {
			if (card.hidden) continue;
			const val = getCardValue(card.rank);
			if (card.rank === 'A') aces++;
			total += val;
		}
		while (total > 21 && aces > 0) {
			total -= 10;
			aces--;
		}
		return total;
	};

	const addLog = (msg: string) => {
		const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
		log = [`[${time}] ${msg}`, ...log].slice(0, 12);
	};

	const startOperation = () => {
		if (credits < currentBet) {
			addLog("CRITICAL: INSUFFICIENT TACTICAL CREDITS.");
			return;
		}
		
		deck = shuffle(createDeck());
		playerHand = [deck.pop()!, deck.pop()!];
		dealerHand = [deck.pop()!, { ...deck.pop()!, hidden: true }];
		gameStatus = 'PLAYING';
		stats.operations++;
		addLog(`OPERATION #${stats.operations.toString().padStart(3, '0')} INITIATED.`);
		
		if (calculateTotal(playerHand) === 21) {
			addLog("BLACKJACK DETECTED IN OPENING SALVO.");
			stand();
		}
	};

	const hit = () => {
		if (gameStatus !== 'PLAYING') return;
		const card = deck.pop()!;
		playerHand = [...playerHand, card];
		addLog(`REINFORCEMENT: DRAWN ${card.rank}${card.suit}.`);
		
		if (calculateTotal(playerHand) > 21) {
			endGame('BUST');
		}
	};

	const stand = async () => {
		if (gameStatus !== 'PLAYING') return;
		gameStatus = 'DEALER_TURN';
		
		// Reveal hidden card
		dealerHand[1].hidden = false;
		dealerHand = [...dealerHand]; // trigger reactivity
		addLog(`DEALER REVEALS POSITION: ${dealerHand[1].rank}${dealerHand[1].suit}.`);

		while (calculateTotal(dealerHand) < 17) {
			await new Promise(r => setTimeout(r, 800));
			const card = deck.pop()!;
			dealerHand = [...dealerHand, card];
			addLog(`DEALER REINFORCING: DRAWN ${card.rank}${card.suit}.`);
		}

		const playerTotal = calculateTotal(playerHand);
		const dealerTotal = calculateTotal(dealerHand);

		if (dealerTotal > 21) {
			endGame('WIN', "DEALER CONTAINMENT BREACH (BUST).");
		} else if (dealerTotal > playerTotal) {
			endGame('LOSS');
		} else if (dealerTotal < playerTotal) {
			endGame('WIN');
		} else {
			endGame('PUSH');
		}
	};

	const endGame = (type: typeof resultType, subMsg = "") => {
		resultType = type;
		gameStatus = 'RESULT';
		
		if (type === 'WIN') {
			credits += currentBet;
			stats.wins++;
			resultMessage = "OBJECTIVE SECURED: WIN";
			addLog(`MISSION SUCCESS. +${currentBet} CREDITS AWARDED.`);
		} else if (type === 'LOSS' || type === 'BUST') {
			credits -= currentBet;
			stats.losses++;
			resultMessage = type === 'BUST' ? "CRITICAL FAILURE: BUST" : "MISSION FAILED: DEFEAT";
			addLog(`MISSION ABORTED. -${currentBet} CREDITS PURGED.`);
		} else {
			resultMessage = "TACTICAL STALEMATE: PUSH";
			addLog("PUSH DETECTED. ASSETS RECOVERED.");
		}
	};

	const resetOperation = () => {
		gameStatus = 'BETTING';
		playerHand = [];
		dealerHand = [];
		resultMessage = "";
	};

	onMount(() => {
		addLog("BLACKJACK TACTICAL SIMULATOR LOADED.");
		addLog("WAITING FOR COMMAND...");
	});
</script>

<svelte:head>
	<title>ARENA.OPS | BLACKJACK</title>
</svelte:head>

{#if !operativeStore.isLoggedIn}
	<OperativeAuth />
{:else}
	<div class="flex flex-col h-screen bg-surface selection:bg-primary/20 selection:text-white">
		<Header />

		<main class="flex-1 flex overflow-hidden">
			<Sidebar />

			<!-- Blackjack Content -->
			<section class="flex-1 overflow-y-auto p-8 flex flex-col items-center">
				<div class="w-full max-w-5xl flex flex-col gap-8">
					
					<!-- Header / Stats Bar -->
					<div class="flex items-center justify-between glass-heavy p-6 border-b-2 border-primary/20">
						<div class="flex items-center gap-4">
							<div class="p-3 bg-primary/10 rounded-sm border border-primary/20 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
								<Dices class="text-primary" size={24} />
							</div>
							<div>
								<h1 class="text-xl font-headline font-bold text-white tracking-widest uppercase">Tactical Blackjack</h1>
								<div class="flex items-center gap-4 mt-1">
									<div class="flex items-center gap-1.5 text-[9px] font-label text-primary/60 uppercase tracking-widest">
										<Activity size={10} />
										Status: <span class="text-primary">System Operational</span>
									</div>
									<div class="flex items-center gap-1.5 text-[9px] font-label text-white/20 uppercase tracking-widest border-l border-white/10 pl-4">
										<Clock size={10} />
										Sector: 7G
									</div>
								</div>
							</div>
						</div>

						<div class="flex items-center gap-8">
							<div class="flex flex-col items-end">
								<span class="text-[9px] font-label font-bold text-white/30 uppercase tracking-[0.2em]">Combat Stats</span>
								<div class="flex items-center gap-4 mt-1">
									<div class="text-center">
										<div class="text-[10px] font-label text-primary/60">W</div>
										<div class="text-sm font-headline text-primary">{stats.wins}</div>
									</div>
									<div class="text-center">
										<div class="text-[10px] font-label text-secondary/60">L</div>
										<div class="text-sm font-headline text-secondary">{stats.losses}</div>
									</div>
								</div>
							</div>
							<div class="flex flex-col items-end border-l border-white/10 pl-8">
								<span class="text-[9px] font-label font-bold text-white/30 uppercase tracking-[0.2em]">Tactical Credits</span>
								<div class="flex items-center gap-2 mt-1">
									<Coins class="text-tertiary" size={16} />
									<span class="text-2xl font-headline font-bold text-tertiary tabular-nums drop-shadow-[0_0_10px_rgba(255,214,0,0.3)]">
										{credits.toLocaleString()}
									</span>
								</div>
							</div>
						</div>
					</div>

					<div class="grid grid-cols-12 gap-8 h-[600px]">
						
						<!-- Game Arena -->
						<div class="col-span-8 flex flex-col gap-6">
							<div class="flex-1 glass-heavy p-8 relative flex flex-col items-center justify-center gap-12 overflow-hidden border border-white/5">
								
								<!-- Background Grid -->
								<div class="absolute inset-0 pointer-events-none opacity-[0.03]" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"></div>
								
								<!-- Result Overlay -->
								{#if gameStatus === 'RESULT'}
									<div class="absolute inset-0 z-20 flex items-center justify-center bg-surface/80 backdrop-blur-sm" in:fade>
										<div class="text-center flex flex-col items-center gap-6" in:scale={{start: 0.9, duration: 400}}>
											{#if resultType === 'WIN'}
												<div class="p-6 bg-primary/10 rounded-full border border-primary/20 shadow-[0_0_30px_rgba(0,255,255,0.2)] animate-bounce">
													<CheckCircle2 class="text-primary" size={64} />
												</div>
											{:else if resultType === 'BUST' || resultType === 'LOSS'}
												<div class="p-6 bg-secondary/10 rounded-full border border-secondary/20 shadow-[0_0_30px_rgba(255,61,0,0.2)] animate-pulse">
													<AlertTriangle class="text-secondary" size={64} />
												</div>
											{:else}
												<div class="p-6 bg-white/10 rounded-full border border-white/20">
													<History class="text-white" size={64} />
												</div>
											{/if}
											
											<div>
												<h2 class="text-4xl font-headline font-bold uppercase tracking-widest mb-2 
													{resultType === 'WIN' ? 'text-primary' : resultType === 'PUSH' ? 'text-white' : 'text-secondary'}">
													{resultMessage}
												</h2>
												<p class="text-white/40 font-label text-[10px] uppercase tracking-[0.3em]">
													{resultType === 'WIN' ? `Asymmetric Advantage Secured. +${currentBet} CR` : 
													 resultType === 'BUST' ? 'Containment Failure Detected.' :
													 resultType === 'PUSH' ? 'Zero-Sum Engagement.' : 'Objective Compromised.'}
												</p>
											</div>

											<button 
												onclick={resetOperation}
												class="mt-8 px-10 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-label font-bold tracking-[0.2em] transition-all flex items-center gap-2 group"
											>
												<RefreshCw size={16} class="group-hover:rotate-180 transition-all duration-500" />
												NEXT ENGAGEMENT
											</button>
										</div>
									</div>
								{/if}

								<!-- Dealer Section -->
								<div class="w-full flex flex-col items-center gap-4 relative">
									<div class="flex items-center gap-3 mb-2">
										<div class="h-[1px] w-12 bg-white/10"></div>
										<span class="text-[10px] font-label font-bold text-white/20 tracking-[0.4em] uppercase">Dealer Unit</span>
										<div class="h-[1px] w-12 bg-white/10"></div>
									</div>
									<div class="flex gap-4">
										{#if dealerHand.length === 0}
											<div class="w-20 h-28 rounded-sm border border-white/5 bg-white/[0.02] flex items-center justify-center opacity-30">
												<GripVertical class="text-white/20" />
											</div>
										{:else}
											{#each dealerHand as card, i}
												<div 
													class="w-20 h-28 rounded-sm border flex flex-col items-center justify-center relative transition-all duration-500
														{card.hidden ? 'bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(0,255,255,0.05)]' : 'bg-surface border-white/10'}"
													in:fly={{y: -20, delay: i * 150}}
												>
													{#if card.hidden}
														<div class="absolute inset-0 flex items-center justify-center animate-pulse">
															<Terminal class="text-primary/30" size={24} />
														</div>
													{:else}
														<span class="text-3xl font-headline font-bold {['♥', '♦'].includes(card.suit) ? 'text-secondary' : 'text-white'}">
															{card.rank}
														</span>
														<span class="text-lg mt-1 opacity-60 {['♥', '♦'].includes(card.suit) ? 'text-secondary' : 'text-white'}">
															{card.suit}
														</span>
													{/if}
												</div>
											{/each}
										{/if}
									</div>
									{#if dealerHand.length > 0 && !dealerHand[1]?.hidden}
										<div class="absolute -right-16 top-1/2 -translate-y-1/2" in:fade>
											<div class="text-[9px] font-label font-bold text-primary/40 mb-1 tracking-widest uppercase">Efficiency</div>
											<div class="text-2xl font-headline font-bold text-primary">{calculateTotal(dealerHand)}</div>
										</div>
									{/if}
								</div>

								<!-- Tactical Divider -->
								<div class="w-full max-w-md h-[2px] bg-gradient-to-r from-transparent via-white/5 to-transparent relative">
									<div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-surface border border-white/5">
										<Zap size={14} class="text-white/10" />
									</div>
								</div>

								<!-- Operative Section -->
								<div class="w-full flex flex-col items-center gap-4 relative">
									<div class="flex items-center gap-3 mb-2">
										<div class="h-[1px] w-12 bg-white/10"></div>
										<span class="text-[10px] font-label font-bold text-white/20 tracking-[0.4em] uppercase">Operative Hand</span>
										<div class="h-[1px] w-12 bg-white/10"></div>
									</div>
									<div class="flex gap-4">
										{#if playerHand.length === 0}
											<div class="w-20 h-28 rounded-sm border border-white/5 bg-white/[0.02] flex items-center justify-center opacity-30">
												<GripVertical class="text-white/20" />
											</div>
										{:else}
											{#each playerHand as card, i}
												<div 
													class="w-20 h-28 rounded-sm border bg-surface border-tertiary/20 flex flex-col items-center justify-center relative shadow-[0_0_15px_rgba(255,214,0,0.05)]"
													in:fly={{y: 20, delay: i * 150}}
												>
													<span class="text-3xl font-headline font-bold {['♥', '♦'].includes(card.suit) ? 'text-secondary' : 'text-tertiary'}">
														{card.rank}
													</span>
													<span class="text-lg mt-1 opacity-60 {['♥', '♦'].includes(card.suit) ? 'text-secondary' : 'text-tertiary'}">
														{card.suit}
													</span>
												</div>
											{/each}
										{/if}
									</div>
									{#if playerHand.length > 0}
										<div class="absolute -right-16 top-1/2 -translate-y-1/2" in:fade>
											<div class="text-[9px] font-label font-bold text-tertiary/40 mb-1 tracking-widest uppercase">Combat Power</div>
											<div class="text-2xl font-headline font-bold text-tertiary">{calculateTotal(playerHand)}</div>
										</div>
									{/if}
								</div>
							</div>

							<!-- Controls -->
							<div class="glass-heavy p-6 border border-white/5 flex items-center justify-between">
								<div class="flex items-center gap-4">
									<div class="flex flex-col">
										<span class="text-[9px] font-label font-bold text-white/20 tracking-widest uppercase mb-2">Stake Level</span>
										<div class="flex items-center gap-2">
											<button 
												disabled={gameStatus !== 'BETTING'}
												onclick={() => currentBet = Math.max(100, currentBet - 100)}
												class="p-2 border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-all"
											>-</button>
											<div class="px-6 py-2 bg-white/5 border border-white/10 font-headline font-bold text-white tabular-nums">
												{currentBet}
											</div>
											<button 
												disabled={gameStatus !== 'BETTING'}
												onclick={() => currentBet += 100}
												class="p-2 border border-white/10 hover:bg-white/5 disabled:opacity-30 transition-all"
											>+</button>
										</div>
									</div>
								</div>

								<div class="flex items-center gap-4">
									{#if gameStatus === 'BETTING'}
										<button 
											onclick={startOperation}
											class="px-12 py-4 bg-primary text-surface font-label font-bold tracking-[0.3em] hover:brightness-110 shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all uppercase"
										>
											Start Operation
										</button>
									{:else if gameStatus === 'PLAYING'}
										<button 
											onclick={hit}
											class="px-10 py-4 bg-white/5 border border-primary/30 text-primary font-label font-bold tracking-[0.3em] hover:bg-primary/10 transition-all uppercase flex items-center gap-2"
										>
											<Zap size={16} />
											Hit
										</button>
										<button 
											onclick={stand}
											class="px-10 py-4 bg-white/5 border border-tertiary/30 text-tertiary font-label font-bold tracking-[0.3em] hover:bg-tertiary/10 transition-all uppercase flex items-center gap-2"
										>
											<Shield size={16} />
											Stand
										</button>
									{:else}
										<div class="px-10 py-4 bg-white/5 border border-white/10 text-white/40 font-label font-bold tracking-[0.3em] uppercase animate-pulse">
											System Processing...
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Tactical Log -->
						<div class="col-span-4 flex flex-col gap-6">
							<div class="flex-1 glass-heavy p-6 border border-white/5 flex flex-col gap-4">
								<div class="flex items-center justify-between border-b border-white/10 pb-4">
									<h2 class="text-xs font-headline font-bold text-white tracking-[0.2em] flex items-center gap-2 uppercase">
										<Terminal size={14} class="text-primary" />
										Mission Intel
									</h2>
									<span class="text-[8px] font-label text-primary/40 animate-pulse uppercase">Live Feed</span>
								</div>
								
								<div class="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
									{#each log as entry, i}
										<div 
											class="text-[10px] font-mono leading-relaxed transition-all duration-300
												{i === 0 ? 'text-primary' : 'text-white/40'}"
											in:fade
										>
											<span class="text-white/20 mr-2">></span>
											{entry}
											{#if i === 0}
												<span class="inline-block w-1.5 h-3 bg-primary ml-1 animate-pulse align-middle"></span>
											{/if}
										</div>
									{/each}
								</div>

								<div class="pt-4 border-t border-white/10">
									<div class="flex items-center justify-between text-[9px] font-label font-bold text-white/20 uppercase tracking-widest">
										<span>Signal Strength</span>
										<span class="text-primary">98.4%</span>
									</div>
									<div class="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
										<div class="h-full bg-primary/40 w-[98%] shadow-[0_0_10px_rgba(0,255,255,0.5)]"></div>
									</div>
								</div>
							</div>

							<div class="glass-heavy p-6 border border-white/5">
								<div class="text-[9px] font-label font-bold text-white/40 mb-4 tracking-widest uppercase">Tactical Guidelines</div>
								<ul class="space-y-2">
									<li class="text-[9px] font-label text-white/30 flex items-center gap-2">
										<ChevronRight size={10} class="text-primary" />
										Dealer stands on 17.
									</li>
									<li class="text-[9px] font-label text-white/30 flex items-center gap-2">
										<ChevronRight size={10} class="text-primary" />
										Aces dynamic scaling (1/11).
									</li>
									<li class="text-[9px] font-label text-white/30 flex items-center gap-2">
										<ChevronRight size={10} class="text-primary" />
										Exceeding 21 triggers failure.
									</li>
								</ul>
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
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
