// ══════════════════════════════════════════
//  ARENA.OPS — Football Data Service
//  Simulated scouting intelligence dataset
// ══════════════════════════════════════════

export interface TeamH2H {
	wins: number;
	draws: number;
	losses: number;
}

export interface TeamData {
	id: string;
	name: string;
	shortName: string;
	badge: string; // emoji flag/icon

	// ── Core Metrics ──
	attackStrength: number;      // 0.6 – 1.6
	defensiveStrength: number;   // 0.6 – 1.5
	avgGoalsPerMatch: number;    // 0.8 – 2.8

	// ── Performance Stats ──
	shotsOnTargetPerGame: number;  // 2.0 – 7.0
	bigChancesCreated: number;     // per game, 1.0 – 4.5
	gkSavePercentage: number;     // 0.55 – 0.82

	// ── Contextual Data ──
	recentForm: ('W' | 'D' | 'L')[];  // last 5 games, newest first
	homePerformance: number;   // multiplier 0.9 – 1.2
	awayPerformance: number;   // multiplier 0.75 – 1.05

	// ── Head-to-Head ──
	h2h: Record<string, TeamH2H>;

	// ── Squad ──
	squadStrength: number; // 0.7 – 1.1 (injuries / star availability)
	
	// ── Advanced Intelligence ──
	goalMargin: number;    // Goal difference of last matches
	discipline: number | null; // Avg cards per game (if available)
}

// ── Team Database ──

const TEAMS: TeamData[] = [
	{
		id: 'real-madrid',
		name: 'Real Madrid',
		shortName: 'RMA',
		badge: '🇪🇸',
		attackStrength: 1.55,
		defensiveStrength: 1.30,
		avgGoalsPerMatch: 2.4,
		shotsOnTargetPerGame: 6.2,
		bigChancesCreated: 4.1,
		gkSavePercentage: 0.78,
		recentForm: ['W', 'W', 'D', 'W', 'L'],
		homePerformance: 1.18,
		awayPerformance: 0.95,
		h2h: {
			'barcelona': { wins: 5, draws: 3, losses: 4 },
			'man-city': { wins: 3, draws: 2, losses: 3 },
			'bayern-munich': { wins: 4, draws: 1, losses: 3 },
			'psg': { wins: 5, draws: 1, losses: 2 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'barcelona',
		name: 'FC Barcelona',
		shortName: 'BAR',
		badge: '🇪🇸',
		attackStrength: 1.50,
		defensiveStrength: 1.15,
		avgGoalsPerMatch: 2.3,
		shotsOnTargetPerGame: 6.0,
		bigChancesCreated: 4.3,
		gkSavePercentage: 0.74,
		recentForm: ['W', 'D', 'W', 'W', 'W'],
		homePerformance: 1.15,
		awayPerformance: 0.92,
		h2h: {
			'real-madrid': { wins: 4, draws: 3, losses: 5 },
			'man-city': { wins: 2, draws: 1, losses: 3 },
			'psg': { wins: 4, draws: 2, losses: 3 },
			'bayern-munich': { wins: 2, draws: 1, losses: 5 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'man-city',
		name: 'Manchester City',
		shortName: 'MCI',
		badge: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
		attackStrength: 1.52,
		defensiveStrength: 1.40,
		avgGoalsPerMatch: 2.5,
		shotsOnTargetPerGame: 6.5,
		bigChancesCreated: 4.0,
		gkSavePercentage: 0.76,
		recentForm: ['W', 'W', 'W', 'D', 'W'],
		homePerformance: 1.20,
		awayPerformance: 1.00,
		h2h: {
			'real-madrid': { wins: 3, draws: 2, losses: 3 },
			'liverpool': { wins: 4, draws: 3, losses: 5 },
			'arsenal': { wins: 5, draws: 2, losses: 3 },
			'bayern-munich': { wins: 2, draws: 2, losses: 2 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'liverpool',
		name: 'Liverpool FC',
		shortName: 'LIV',
		badge: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
		attackStrength: 1.48,
		defensiveStrength: 1.28,
		avgGoalsPerMatch: 2.2,
		shotsOnTargetPerGame: 5.8,
		bigChancesCreated: 3.8,
		gkSavePercentage: 0.79,
		recentForm: ['W', 'L', 'W', 'D', 'W'],
		homePerformance: 1.16,
		awayPerformance: 0.93,
		h2h: {
			'man-city': { wins: 5, draws: 3, losses: 4 },
			'arsenal': { wins: 4, draws: 3, losses: 3 },
			'real-madrid': { wins: 2, draws: 1, losses: 4 },
			'bayern-munich': { wins: 3, draws: 1, losses: 2 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'arsenal',
		name: 'Arsenal FC',
		shortName: 'ARS',
		badge: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
		attackStrength: 1.38,
		defensiveStrength: 1.35,
		avgGoalsPerMatch: 2.0,
		shotsOnTargetPerGame: 5.4,
		bigChancesCreated: 3.5,
		gkSavePercentage: 0.77,
		recentForm: ['D', 'W', 'W', 'L', 'W'],
		homePerformance: 1.14,
		awayPerformance: 0.90,
		h2h: {
			'man-city': { wins: 3, draws: 2, losses: 5 },
			'liverpool': { wins: 3, draws: 3, losses: 4 },
			'bayern-munich': { wins: 1, draws: 2, losses: 3 },
			'psg': { wins: 2, draws: 1, losses: 2 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'bayern-munich',
		name: 'Bayern Munich',
		shortName: 'BAY',
		badge: '🇩🇪',
		attackStrength: 1.58,
		defensiveStrength: 1.25,
		avgGoalsPerMatch: 2.7,
		shotsOnTargetPerGame: 6.8,
		bigChancesCreated: 4.4,
		gkSavePercentage: 0.73,
		recentForm: ['W', 'W', 'L', 'W', 'W'],
		homePerformance: 1.18,
		awayPerformance: 0.96,
		h2h: {
			'real-madrid': { wins: 3, draws: 1, losses: 4 },
			'barcelona': { wins: 5, draws: 1, losses: 2 },
			'man-city': { wins: 2, draws: 2, losses: 2 },
			'dortmund': { wins: 6, draws: 2, losses: 3 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'dortmund',
		name: 'Borussia Dortmund',
		shortName: 'BVB',
		badge: '🇩🇪',
		attackStrength: 1.30,
		defensiveStrength: 1.05,
		avgGoalsPerMatch: 1.9,
		shotsOnTargetPerGame: 4.8,
		bigChancesCreated: 3.2,
		gkSavePercentage: 0.71,
		recentForm: ['L', 'W', 'D', 'W', 'L'],
		homePerformance: 1.15,
		awayPerformance: 0.85,
		h2h: {
			'bayern-munich': { wins: 3, draws: 2, losses: 6 },
			'psg': { wins: 2, draws: 1, losses: 2 },
			'real-madrid': { wins: 1, draws: 2, losses: 3 },
			'inter-milan': { wins: 2, draws: 1, losses: 1 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'psg',
		name: 'Paris Saint-Germain',
		shortName: 'PSG',
		badge: '🇫🇷',
		attackStrength: 1.45,
		defensiveStrength: 1.18,
		avgGoalsPerMatch: 2.3,
		shotsOnTargetPerGame: 5.9,
		bigChancesCreated: 3.9,
		gkSavePercentage: 0.72,
		recentForm: ['W', 'D', 'W', 'L', 'D'],
		homePerformance: 1.16,
		awayPerformance: 0.88,
		h2h: {
			'real-madrid': { wins: 2, draws: 1, losses: 5 },
			'barcelona': { wins: 3, draws: 2, losses: 4 },
			'man-city': { wins: 1, draws: 1, losses: 3 },
			'dortmund': { wins: 2, draws: 1, losses: 2 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'juventus',
		name: 'Juventus FC',
		shortName: 'JUV',
		badge: '🇮🇹',
		attackStrength: 1.20,
		defensiveStrength: 1.32,
		avgGoalsPerMatch: 1.6,
		shotsOnTargetPerGame: 4.5,
		bigChancesCreated: 2.8,
		gkSavePercentage: 0.80,
		recentForm: ['D', 'D', 'W', 'L', 'D'],
		homePerformance: 1.12,
		awayPerformance: 0.88,
		h2h: {
			'inter-milan': { wins: 4, draws: 4, losses: 3 },
			'ac-milan': { wins: 5, draws: 2, losses: 3 },
			'real-madrid': { wins: 2, draws: 1, losses: 4 },
			'barcelona': { wins: 1, draws: 2, losses: 3 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'inter-milan',
		name: 'Inter Milan',
		shortName: 'INT',
		badge: '🇮🇹',
		attackStrength: 1.35,
		defensiveStrength: 1.38,
		avgGoalsPerMatch: 2.0,
		shotsOnTargetPerGame: 5.2,
		bigChancesCreated: 3.3,
		gkSavePercentage: 0.78,
		recentForm: ['W', 'W', 'D', 'W', 'L'],
		homePerformance: 1.14,
		awayPerformance: 0.92,
		h2h: {
			'juventus': { wins: 3, draws: 4, losses: 4 },
			'ac-milan': { wins: 5, draws: 2, losses: 4 },
			'man-city': { wins: 1, draws: 1, losses: 3 },
			'dortmund': { wins: 1, draws: 1, losses: 2 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'ac-milan',
		name: 'AC Milan',
		shortName: 'ACM',
		badge: '🇮🇹',
		attackStrength: 1.28,
		defensiveStrength: 1.20,
		avgGoalsPerMatch: 1.8,
		shotsOnTargetPerGame: 4.9,
		bigChancesCreated: 3.0,
		gkSavePercentage: 0.75,
		recentForm: ['L', 'D', 'W', 'W', 'L'],
		homePerformance: 1.10,
		awayPerformance: 0.85,
		h2h: {
			'juventus': { wins: 3, draws: 2, losses: 5 },
			'inter-milan': { wins: 4, draws: 2, losses: 5 },
			'liverpool': { wins: 3, draws: 1, losses: 4 },
			'real-madrid': { wins: 2, draws: 1, losses: 4 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
	{
		id: 'atletico-madrid',
		name: 'Atlético Madrid',
		shortName: 'ATM',
		badge: '🇪🇸',
		attackStrength: 1.18,
		defensiveStrength: 1.42,
		avgGoalsPerMatch: 1.5,
		shotsOnTargetPerGame: 4.2,
		bigChancesCreated: 2.5,
		gkSavePercentage: 0.81,
		recentForm: ['W', 'D', 'D', 'W', 'W'],
		homePerformance: 1.15,
		awayPerformance: 0.90,
		h2h: {
			'real-madrid': { wins: 3, draws: 4, losses: 5 },
			'barcelona': { wins: 3, draws: 3, losses: 4 },
			'liverpool': { wins: 2, draws: 2, losses: 2 },
			'juventus': { wins: 3, draws: 2, losses: 1 },
		},
		squadStrength: 1.0,
		goalMargin: 0,
		discipline: null,
	},
];

// ── Public API ──

/** Get all teams for selector dropdowns. */
export function getAllTeams(): TeamData[] {
	return TEAMS;
}

/** Look up a single team by ID. */
export function getTeamById(id: string): TeamData | undefined {
	return TEAMS.find((t) => t.id === id);
}

/**
 * Get Head-to-Head record from teamA's perspective.
 * Returns a neutral record if no history exists.
 */
export function getH2H(teamAId: string, teamBId: string): TeamH2H {
	const teamA = getTeamById(teamAId);
	if (teamA?.h2h[teamBId]) {
		return teamA.h2h[teamBId];
	}
	// Mirror from teamB if available
	const teamB = getTeamById(teamBId);
	if (teamB?.h2h[teamAId]) {
		const mirror = teamB.h2h[teamAId];
		return { wins: mirror.losses, draws: mirror.draws, losses: mirror.wins };
	}
	// No history — neutral
	return { wins: 2, draws: 2, losses: 2 };
}

/**
 * Calculate a weighted form momentum multiplier.
 * Recent games carry heavier weight.
 * Returns a value between ~0.85 (terrible form) and ~1.15 (hot streak).
 */
export function calculateFormMomentum(form: ('W' | 'D' | 'L')[]): number {
	const weights = [5, 4, 3, 2, 1]; // newest game → highest weight
	const values: Record<string, number> = { W: 1.0, D: 0.4, L: 0.0 };

	let weightedSum = 0;
	let totalWeight = 0;

	for (let i = 0; i < form.length && i < weights.length; i++) {
		weightedSum += values[form[i]] * weights[i];
		totalWeight += weights[i];
	}

	const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
	// Map 0..1 → 0.85..1.15
	return 0.85 + rawScore * 0.30;
}
