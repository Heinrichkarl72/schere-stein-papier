// ══════════════════════════════════════════
//  ARENA.OPS — Football API Types & Mappers
//  Integration with football-data.org v4
// ══════════════════════════════════════════

import type { TeamData } from './footballData';
import { calculateFormMomentum } from './footballData';

// ── Raw API Response Types ──

export interface ApiTeamRef {
	id: number;
	name: string;
	shortName: string;
	crest: string;
}

export interface ApiCompetition {
	id: number;
	name: string;
	code: string;
	emblem: string;
}

export interface ApiMatch {
	id: number;
	utcDate: string;
	status: string;
	matchday: number;
	competition: ApiCompetition;
	homeTeam: ApiTeamRef;
	awayTeam: ApiTeamRef;
	score: {
		fullTime: { home: number | null; away: number | null };
		halfTime: { home: number | null; away: number | null };
	};
}

export interface ApiStandingsEntry {
	position: number;
	team: ApiTeamRef;
	playedGames: number;
	won: number;
	draw: number;
	lost: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDifference: number;
	points: number;
	form: string | null;
}

export interface ApiScorer {
	player: { id: number; name: string; position: string };
	team: ApiTeamRef;
	goals: number;
	assists: number | null;
}

export interface ApiLineup {
	id: number;
	name: string;
	position: string;
	shirtNumber: number;
}

export interface ApiMatchDetails extends ApiMatch {
	homeTeam: ApiTeamRef & { squad: ApiLineup[] };
	awayTeam: ApiTeamRef & { squad: ApiLineup[] };
}

// ── App-Level Mapped Types ──

export interface LiveFixture {
	id: number;
	utcDate: string;
	status: string;
	matchday: number;
	competition: { code: string; name: string; emblem: string };
	homeTeam: { id: number; name: string; shortName: string; crest: string };
	awayTeam: { id: number; name: string; shortName: string; crest: string };
	score: { home: number | null; away: number | null };
}

export interface TeamStanding {
	teamId: number;
	name: string;
	shortName: string;
	crest: string;
	position: number;
	played: number;
	won: number;
	drawn: number;
	lost: number;
	goalsFor: number;
	goalsAgainst: number;
	points: number;
	form: ('W' | 'D' | 'L')[];
	competitionCode: string;
}

export interface StarPlayer {
	id: number;
	name: string;
	goals: number;
	teamId: number;
}

export interface TacticalContext {
	homeStarPlayers: StarPlayer[];
	awayStarPlayers: StarPlayer[];
	homeLineup: string[];
	awayLineup: string[];
}

// ── Mapping Helpers ──

/** Parse the API form string "W,D,L,W,W" into a typed array. */
export function parseForm(formStr: string | null): ('W' | 'D' | 'L')[] {
	if (!formStr) return ['D', 'D', 'D', 'D', 'D'];
	return formStr
		.split(',')
		.filter((f): f is 'W' | 'D' | 'L' => f === 'W' || f === 'D' || f === 'L')
		.reverse()
		.slice(0, 5);
}

/** Convert a raw API match into our LiveFixture shape. */
export function mapMatch(match: ApiMatch): LiveFixture {
	return {
		id: match.id,
		utcDate: match.utcDate,
		status: match.status,
		matchday: match.matchday,
		competition: {
			code: match.competition.code,
			name: match.competition.name,
			emblem: match.competition.emblem
		},
		homeTeam: {
			id: match.homeTeam.id,
			name: match.homeTeam.name,
			shortName: match.homeTeam.shortName,
			crest: match.homeTeam.crest
		},
		awayTeam: {
			id: match.awayTeam.id,
			name: match.awayTeam.name,
			shortName: match.awayTeam.shortName,
			crest: match.awayTeam.crest
		},
		score: {
			home: match.score?.fullTime?.home ?? null,
			away: match.score?.fullTime?.away ?? null
		}
	};
}

/** Convert a raw API standings entry into our TeamStanding shape. */
export function mapStandingsEntry(
	entry: ApiStandingsEntry,
	competitionCode: string
): TeamStanding {
	return {
		teamId: entry.team.id,
		name: entry.team.name,
		shortName: entry.team.shortName,
		crest: entry.team.crest,
		position: entry.position,
		played: entry.playedGames,
		won: entry.won,
		drawn: entry.draw,
		lost: entry.lost,
		goalsFor: entry.goalsFor,
		goalsAgainst: entry.goalsAgainst,
		points: entry.points,
		form: parseForm(entry.form),
		competitionCode
	};
}

/**
 * Convert a TeamStanding into the TeamData shape consumed by the predictor engine.
 * Derives attack/defense strengths from goals scored/conceded relative to league average.
 */
export function standingToTeamData(
	standing: TeamStanding,
	leagueAvgGoalsFor: number,
	leagueAvgGoalsAgainst: number
): TeamData {
	const gamesPlayed = Math.max(standing.played, 1);
	const goalsPerGame = standing.goalsFor / gamesPlayed;
	const goalsConcededPerGame = standing.goalsAgainst / gamesPlayed;

	// Attack strength relative to league average (typical range 0.6 - 1.6)
	const attackStrength = Math.max(0.6, Math.min(1.6, goalsPerGame / Math.max(leagueAvgGoalsFor, 0.5)));

	// Defensive strength: higher = better defense. Inverse of concede rate vs league avg.
	const rawDefense = leagueAvgGoalsAgainst / Math.max(goalsConcededPerGame, 0.3);
	const defensiveStrength = Math.max(0.6, Math.min(1.5, rawDefense));

	// Estimate shots on target from goals (typical conversion ~30-40%)
	const estimatedShotsOT = goalsPerGame / 0.33;

	// Estimate big chances from position (top teams create more)
	const positionFactor = Math.max(0, 1 - (standing.position - 1) / 20);
	const bigChances = 1.5 + positionFactor * 3.0;

	// GK save percentage estimated from goals conceded vs league average
	const gkSave = Math.max(0.55, Math.min(0.82, 0.68 + (1 - goalsConcededPerGame / Math.max(leagueAvgGoalsAgainst, 0.5)) * 0.15));

	// Home/away performance from win rate (estimated)
	const winRate = standing.won / gamesPlayed;
	const homePerf = Math.max(0.9, Math.min(1.2, 1.0 + (winRate - 0.4) * 0.4));
	const awayPerf = Math.max(0.75, Math.min(1.05, 0.85 + (winRate - 0.4) * 0.3));

	// Form from standings
	const form = standing.form.length >= 5 ? standing.form : [...standing.form, ...(['D', 'D', 'D', 'D', 'D'] as const)].slice(0, 5) as ('W' | 'D' | 'L')[];

	return {
		id: `api-${standing.teamId}`,
		name: standing.name,
		shortName: standing.shortName,
		badge: standing.crest, // will be a URL for live teams
		attackStrength,
		defensiveStrength,
		avgGoalsPerMatch: goalsPerGame,
		shotsOnTargetPerGame: estimatedShotsOT,
		bigChancesCreated: bigChances,
		gkSavePercentage: gkSave,
		recentForm: form,
		homePerformance: homePerf,
		awayPerformance: awayPerf,
		h2h: {}, // no H2H from standings API — engine uses neutral default
		squadStrength: 1.0,
		goalMargin: standing.goalsFor - standing.goalsAgainst,
		discipline: null // API free tier doesn't provide easy card stats in standings
	};
}

/**
 * Calculate the league average goals per game from all standings entries.
 */
export function calcLeagueAvgGoals(standings: TeamStanding[]): {
	avgFor: number;
	avgAgainst: number;
} {
	if (standings.length === 0) return { avgFor: 1.35, avgAgainst: 1.35 };

	let totalFor = 0;
	let totalAgainst = 0;
	let totalGames = 0;

	for (const s of standings) {
		totalFor += s.goalsFor;
		totalAgainst += s.goalsAgainst;
		totalGames += s.played;
	}

	const games = Math.max(totalGames, 1);
	return {
		avgFor: totalFor / games,
		avgAgainst: totalAgainst / games
	};
}

/**
 * Calculate the Star Player Factor based on how many top scorers are in the starting lineup.
 * Returns a multiplier (e.g., 0.95 to 1.05).
 */
export function calculateStarPlayerFactor(
	starPlayers: StarPlayer[],
	lineup: string[]
): number {
	if (starPlayers.length === 0) return 1.0;

	let availableStars = 0;
	const lineupLower = lineup.map((n) => n.toLowerCase());

	for (const star of starPlayers) {
		const nameParts = star.name.toLowerCase().split(' ');
		// Check if any part of the star's name or full name is in the lineup
		if (lineupLower.some((name) => name.includes(star.name.toLowerCase()) || nameParts.some(part => part.length > 3 && name.includes(part)))) {
			availableStars++;
		}
	}

	// Each missing star player (out of top 3) reduces strength by 2.5%
	// If all are present, strength increases by 2.5%
	const base = 1.0;
	const impact = (availableStars - 2) * 0.025; // 3 stars = 1.025, 2 stars = 1.0, 1 star = 0.975, 0 = 0.95
	return base + impact;
}
