// ══════════════════════════════════════════
//  ARENA.OPS — Predictor Engine
//  Multi-factor Poisson-based match outcome predictor
// ══════════════════════════════════════════

import { getTeamById, getH2H, calculateFormMomentum } from '$lib/services/footballData';
import type { TeamData } from '$lib/services/footballData';
import { calculateStarPlayerFactor } from '$lib/services/footballApi';
import type { TacticalContext } from '$lib/services/footballApi';

// ── Exported Types ──

export interface TacticalInsight {
	type: 'STREAK' | 'FIREPOWER' | 'DEFENSE' | 'DISCIPLINE' | 'VENUES';
	label: string;
	value: string;
	intensity: 'LOW' | 'MEDIUM' | 'HIGH';
	iconType: 'SUCCESS' | 'WARNING' | 'NEUTRAL';
}

export interface RadarMetrics {
	attack: number;     // 0–100
	defense: number;
	efficiency: number;
	form: number;
	setPieces: number;
}

export interface PredictionResult {
	homeWinPct: number;
	drawPct: number;
	awayWinPct: number;
	mostLikelyScore: string;
	mostLikelyHomeGoals: number;
	mostLikelyAwayGoals: number;
	riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
	homeExpectedGoals: number;
	awayExpectedGoals: number;
	radarHome: RadarMetrics;
	radarAway: RadarMetrics;
	confidenceScore: number;
	tacticalBreakdown: {
		starPlayerImpact: { home: number; away: number };
		momentumShift: { home: number; away: number };
		leagueFactor: number;
		homeInsights: TacticalInsight[];
		awayInsights: TacticalInsight[];
	};
}

// ── Math Helpers ──

/** Factorial with memoization for 0..10 */
const factorialCache: number[] = [1];
function factorial(n: number): number {
	if (n < 0) return 1;
	if (factorialCache[n] !== undefined) return factorialCache[n];
	factorialCache[n] = n * factorial(n - 1);
	return factorialCache[n];
}

/** Poisson probability mass function: P(X = k) given λ */
function poissonPMF(lambda: number, k: number): number {
	if (lambda <= 0) return k === 0 ? 1 : 0;
	return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/** Clamp a number between min and max. */
function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

/** Normalize a value from an input range to 0–100. */
function normalize(value: number, min: number, max: number): number {
	return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

// ── Core Prediction ──

/**
 * Calculate match outcome probabilities using a multi-factor Poisson model.
 *
 * Steps:
 * 1. Base λ from attack × opponent's defensive weakness × avgGoals × squad
 * 2. Efficiency adjustment (shots-to-goals conversion)
 * 3. Form momentum multiplier
 * 4. H2H dominance bonus
 * 5. Home/Away venue split
 * 6. Chaos factor (random variance)
 * 7. Poisson score matrix → probabilities
 */
/**
 * Generates tactical insights based on team data and context.
 */
function generateTacticalInsights(team: TeamData, isHome: boolean, context?: any): TacticalInsight[] {
	const insights: TacticalInsight[] = [];
	const form = team.recentForm;

	// 1. Streak Detection (Iterative from most recent)
	let winStreak = 0;
	for (const res of form) {
		if (res === 'W') winStreak++;
		else break;
	}

	let unbeatenStreak = 0;
	for (const res of form) {
		if (res !== 'L') unbeatenStreak++;
		else break;
	}

	if (winStreak >= 2) {
		insights.push({
			type: 'STREAK',
			label: 'UNIT STATUS',
			value: `${winStreak} CONSECUTIVE VICTORIES`,
			intensity: winStreak >= 4 ? 'HIGH' : 'MEDIUM',
			iconType: 'SUCCESS'
		});
	} else if (unbeatenStreak >= 3) {
		insights.push({
			type: 'STREAK',
			label: 'UNIT STATUS',
			value: `UNBEATEN IN ${unbeatenStreak} MATCHES`,
			intensity: unbeatenStreak >= 5 ? 'HIGH' : 'MEDIUM',
			iconType: 'SUCCESS'
		});
	} else if (form[0] === 'L') {
		// Losing streak
		let lossStreak = 0;
		for (const res of form) {
			if (res === 'L') lossStreak++;
			else break;
		}
		if (lossStreak >= 2) {
			insights.push({
				type: 'STREAK',
				label: 'CRITICAL STATUS',
				value: `${lossStreak} CONSECUTIVE LOSSES`,
				intensity: 'HIGH',
				iconType: 'WARNING'
			});
		}
	}

	// 2. Scoring Threat (Firepower / Momentum)
	const starPlayers = isHome ? context?.homeStarPlayers : context?.awayStarPlayers;
	if (starPlayers && starPlayers.length > 0) {
		const topScorer = starPlayers[0];
		insights.push({
			type: 'FIREPOWER',
			label: 'ELITE STRIKER',
			value: `${topScorer.name.toUpperCase()} ACTIVE (${topScorer.goals} GOALS)`,
			intensity: 'HIGH',
			iconType: 'SUCCESS'
		});
	} else {
		// Fallback to Team Momentum / Goal Margin
		const margin = team.goalMargin;
		insights.push({
			type: 'FIREPOWER',
			label: 'TEAM MOMENTUM',
			value: `NET MARGIN: ${margin > 0 ? '+' : ''}${margin} GOALS`,
			intensity: margin > 5 ? 'HIGH' : 'MEDIUM',
			iconType: margin > 0 ? 'SUCCESS' : 'NEUTRAL'
		});
	}

	// 3. Defensive Profile / Discipline
	if (team.discipline !== null) {
		insights.push({
			type: 'DISCIPLINE',
			label: 'OPERATIONAL CONDUCT',
			value: `AVG ${team.discipline.toFixed(1)} CARDS/OP`,
			intensity: team.discipline > 3 ? 'HIGH' : 'LOW',
			iconType: team.discipline > 3 ? 'WARNING' : 'SUCCESS'
		});
	} else if (team.defensiveStrength > 1.25) {
		insights.push({
			type: 'DEFENSE',
			label: 'FORTRESS',
			value: 'ELITE ARMOR INTEGRITY',
			intensity: 'HIGH',
			iconType: 'SUCCESS'
		});
	} else {
		insights.push({
			type: 'DISCIPLINE',
			label: 'DISCIPLINE',
			value: 'DATA N/A',
			intensity: 'LOW',
			iconType: 'NEUTRAL'
		});
	}

	return insights.slice(0, 3);
}

/**
 * Calculate from live TeamData objects (bypasses simulated DB lookup).
 */
export function calculateProbabilityFromData(
	home: TeamData,
	away: TeamData,
	context?: TacticalContext & { 
		homeMomentum?: number; 
		awayMomentum?: number;
		leagueCode?: string;
	}
): PredictionResult {
	// ── Base Strength Adjustment ──
	let homeStarFactor = 1.0;
	let awayStarFactor = 1.0;

	if (context?.homeLineup && context.homeStarPlayers) {
		homeStarFactor = calculateStarPlayerFactor(context.homeStarPlayers, context.homeLineup);
		awayStarFactor = calculateStarPlayerFactor(context.awayStarPlayers, context.awayLineup);
	}

	// Apply star factor to base strengths (temporary clone to avoid mutating original)
	const adjustedHome = { ...home, attackStrength: home.attackStrength * homeStarFactor };
	const adjustedAway = { ...away, attackStrength: away.attackStrength * awayStarFactor };

	// ── League Specific Weighting ──
	let leagueGoalMultiplier = 1.0;
	if (context?.leagueCode === 'BL1') leagueGoalMultiplier = 1.1;
	if (context?.leagueCode === 'SA') leagueGoalMultiplier = 0.9;

	const prediction = runPoissonModel(adjustedHome, adjustedAway);

	// ── Refine with Momentum Shift ──
	if (context?.homeMomentum !== undefined && context?.awayMomentum !== undefined) {
		const momentumDiff = (context.homeMomentum - context.awayMomentum) * 0.05;
		prediction.homeExpectedGoals = parseFloat((prediction.homeExpectedGoals + momentumDiff).toFixed(2));
		prediction.awayExpectedGoals = parseFloat((prediction.awayExpectedGoals - momentumDiff).toFixed(2));
	}

	// ── Calculate Confidence Score ──
	let confidence = 65; 
	if (context?.homeLineup?.length) confidence += 15;
	if (context?.homeMomentum !== undefined) confidence += 10;
	if (home.recentForm.length >= 5) confidence += 5;
	confidence = Math.min(98, confidence);

	return {
		...prediction,
		confidenceScore: confidence,
		tacticalBreakdown: {
			starPlayerImpact: { 
				home: Math.round((homeStarFactor - 1) * 100), 
				away: Math.round((awayStarFactor - 1) * 100) 
			},
			momentumShift: {
				home: context?.homeMomentum || 0,
				away: context?.awayMomentum || 0
			},
			leagueFactor: leagueGoalMultiplier,
			homeInsights: generateTacticalInsights(home, true, context),
			awayInsights: generateTacticalInsights(away, false, context)
		}
	};
}

export function calculateProbability(
	homeTeamId: string,
	awayTeamId: string
): PredictionResult {
	const home = getTeamById(homeTeamId);
	const away = getTeamById(awayTeamId);

	if (!home || !away) {
		throw new Error(`Team not found: ${!home ? homeTeamId : awayTeamId}`);
	}

	return runPoissonModel(home, away);
}

/**
 * Core Poisson model shared by both code paths.
 */
function runPoissonModel(
	home: TeamData,
	away: TeamData
): PredictionResult {

	// ── Step 1: Base Expected Goals (λ) ──
	// Home team: their attack vs away team's defensive weakness
	// Defensive weakness = inverse of defensive strength
	const leagueAvgGoals = 1.35; // average goals per team per match (league baseline)

	let homeLambda =
		home.attackStrength *
		(1 / away.defensiveStrength) *
		home.avgGoalsPerMatch *
		home.squadStrength *
		(leagueAvgGoals / 1.35); // normalized against league avg

	let awayLambda =
		away.attackStrength *
		(1 / home.defensiveStrength) *
		away.avgGoalsPerMatch *
		away.squadStrength *
		(leagueAvgGoals / 1.35);

	// ── Step 2: Efficiency Adjustment ──
	// Teams that convert chances efficiently get a boost
	const homeEfficiency = home.shotsOnTargetPerGame > 0
		? (home.avgGoalsPerMatch / home.shotsOnTargetPerGame)
		: 0.3;
	const awayEfficiency = away.shotsOnTargetPerGame > 0
		? (away.avgGoalsPerMatch / away.shotsOnTargetPerGame)
		: 0.3;

	// Normalize efficiency around a baseline of ~0.35
	homeLambda *= 1 + (homeEfficiency - 0.35) * 0.5;
	awayLambda *= 1 + (awayEfficiency - 0.35) * 0.5;

	// ── Step 3: Form Momentum ──
	const homeFormMultiplier = calculateFormMomentum(home.recentForm);
	const awayFormMultiplier = calculateFormMomentum(away.recentForm);

	homeLambda *= homeFormMultiplier;
	awayLambda *= awayFormMultiplier;

	// ── Step 4: H2H Dominance ──
	const h2h = getH2H(home.id, away.id);
	const h2hTotal = h2h.wins + h2h.draws + h2h.losses;
	if (h2hTotal > 0) {
		const homeH2HRate = h2h.wins / h2hTotal;
		const awayH2HRate = h2h.losses / h2hTotal;

		// Only apply bonus if one team clearly dominates (>50% win rate)
		if (homeH2HRate > 0.5) {
			homeLambda += (homeH2HRate - 0.5) * 0.2;
		}
		if (awayH2HRate > 0.5) {
			awayLambda += (awayH2HRate - 0.5) * 0.2;
		}
	}

	// ── Step 5: Home/Away Venue Adjustment ──
	homeLambda *= home.homePerformance;
	awayLambda *= away.awayPerformance;

	// ── Step 6: Chaos Factor ──
	const homeChaos = (Math.random() - 0.5) * 0.15;
	const awayChaos = (Math.random() - 0.5) * 0.15;
	homeLambda = Math.max(0.3, homeLambda + homeChaos);
	awayLambda = Math.max(0.3, awayLambda + awayChaos);

	// ── Step 7: Poisson Score Matrix ──
	const maxGoals = 7;
	const scoreMatrix: number[][] = [];

	for (let hg = 0; hg < maxGoals; hg++) {
		scoreMatrix[hg] = [];
		for (let ag = 0; ag < maxGoals; ag++) {
			scoreMatrix[hg][ag] = poissonPMF(homeLambda, hg) * poissonPMF(awayLambda, ag);
		}
	}

	// ── Calculate Outcome Probabilities ──
	let homeWin = 0;
	let draw = 0;
	let awayWin = 0;
	let maxProb = 0;
	let likelyHome = 0;
	let likelyAway = 0;

	for (let hg = 0; hg < maxGoals; hg++) {
		for (let ag = 0; ag < maxGoals; ag++) {
			const prob = scoreMatrix[hg][ag];
			if (hg > ag) homeWin += prob;
			else if (hg === ag) draw += prob;
			else awayWin += prob;

			if (prob > maxProb) {
				maxProb = prob;
				likelyHome = hg;
				likelyAway = ag;
			}
		}
	}

	// Normalize to ensure they sum to 100
	const total = homeWin + draw + awayWin;
	const homeWinPct = Math.round((homeWin / total) * 100);
	const drawPct = Math.round((draw / total) * 100);
	const awayWinPct = 100 - homeWinPct - drawPct; // ensures exactly 100

	// ── Risk Assessment ──
	// Based on the spread of the λ values + form instability
	const lambdaSpread = Math.abs(homeLambda - awayLambda);
	const formVolatility = Math.abs(homeFormMultiplier - awayFormMultiplier);
	const riskScore = lambdaSpread * 0.4 + formVolatility * 0.3 + (1 - maxProb * 5) * 0.3;

	let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
	if (riskScore < 0.35) riskLevel = 'LOW';
	else if (riskScore < 0.6) riskLevel = 'MEDIUM';
	else riskLevel = 'HIGH';

	// ── Radar Metrics ──
	const radarHome = buildRadarMetrics(home);
	const radarAway = buildRadarMetrics(away);

	return {
		homeWinPct,
		drawPct,
		awayWinPct,
		mostLikelyScore: `${likelyHome} - ${likelyAway}`,
		mostLikelyHomeGoals: likelyHome,
		mostLikelyAwayGoals: likelyAway,
		riskLevel,
		homeExpectedGoals: Math.round(homeLambda * 100) / 100,
		awayExpectedGoals: Math.round(awayLambda * 100) / 100,
		radarHome,
		radarAway,
		confidenceScore: 75, // Default for manual mode
		tacticalBreakdown: {
			starPlayerImpact: { home: 0, away: 0 },
			momentumShift: { home: 0, away: 0 },
			leagueFactor: 1.0,
			homeInsights: [],
			awayInsights: []
		}
	};
}

/** Convert raw team data into 0–100 normalized radar axes. */
function buildRadarMetrics(team: TeamData): RadarMetrics {
	return {
		attack: normalize(team.attackStrength, 0.6, 1.6),
		defense: normalize(team.defensiveStrength, 0.6, 1.5),
		efficiency: normalize(
			team.shotsOnTargetPerGame > 0
				? team.avgGoalsPerMatch / team.shotsOnTargetPerGame
				: 0,
			0.15,
			0.5
		),
		form: normalize(calculateFormMomentum(team.recentForm), 0.85, 1.15),
		setPieces: normalize(team.bigChancesCreated, 1.0, 4.5),
	};
}
