// ══════════════════════════════════════════
//  ARENA.OPS — Predictor Server Load
//  Fetches live match data from football-data.org v4
// ══════════════════════════════════════════

import type { PageServerLoad } from './$types';
import { FOOTBALL_API_KEY } from '$env/static/private';
import type { ApiMatch, ApiStandingsEntry, ApiScorer, StarPlayer } from '$lib/services/footballApi';
import { mapMatch, mapStandingsEntry } from '$lib/services/footballApi';
import type { LiveFixture, TeamStanding } from '$lib/services/footballApi';

// Enable prerendering — this page will be built with data from the last CI/CD run
export const prerender = true;

const BASE_URL = 'https://api.football-data.org/v4';
const COMPETITIONS = ['PL', 'BL1', 'PD', 'SA', 'FL1', 'WC'] as const;

// ── Cache Implementation ──
// Free tier has 10 req/min limit. We cache competition data for 10 minutes.
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchWithCache<T>(path: string, apiKey: string): Promise<T> {
	const now = Date.now();
	if (cache[path] && now - cache[path].timestamp < CACHE_TTL) {
		return cache[path].data as T;
	}

	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { 'X-Auth-Token': apiKey }
	});

	if (!res.ok) {
		if (res.status === 429) {
			// If rate limited, return stale data if available
			if (cache[path]) return cache[path].data as T;
			throw new Error('OPERATIONAL LIMIT REACHED. PLEASE WAIT 60 SECONDS.');
		}
		const body = await res.text().catch(() => '');
		throw new Error(`Football API ${res.status}: ${res.statusText} — ${body}`);
	}

	const data = await res.json();
	cache[path] = { data, timestamp: now };
	return data as T;
}

/**
 * Get today's date in YYYY-MM-DD format (UTC).
 */
function todayUTC(): string {
	return new Date().toISOString().slice(0, 10);
}

export const load: PageServerLoad = async () => {
	const apiKey = FOOTBALL_API_KEY;

	if (!apiKey || apiKey === 'your_api_key_here') {
		console.warn('[PREDICTOR] FOOTBALL_API_KEY not configured — returning empty live data.');
		return {
			fixtures: [] as LiveFixture[],
			standings: [] as TeamStanding[],
			leagueStars: {} as Record<string, StarPlayer[]>,
			liveError: 'API key not configured. Set FOOTBALL_API_KEY in your .env file.'
		};
	}

	const today = todayUTC();
	const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

	const fixtures: LiveFixture[] = [];
	const standings: TeamStanding[] = [];
	const leagueStars: Record<string, StarPlayer[]> = {};

	try {
		// Fetch matches, standings & scorers for each competition
		const results = await Promise.allSettled(
			COMPETITIONS.flatMap((code) => [
				fetchWithCache<{ matches: ApiMatch[] }>(
					`/competitions/${code}/matches?dateFrom=${today}&dateTo=${tomorrow}`,
					apiKey
				).then((data) => ({ type: 'matches' as const, code, matches: data.matches ?? [] })),

				fetchWithCache<{ standings: { type: string; table: ApiStandingsEntry[] }[] }>(
					`/competitions/${code}/standings`,
					apiKey
				).then((data) => ({
					type: 'standings' as const,
					code,
					entries: data.standings?.find((s) => s.type === 'TOTAL')?.table ?? []
				})),

				fetchWithCache<{ scorers: ApiScorer[] }>(
					`/competitions/${code}/scorers?limit=5`,
					apiKey
				).then((data) => ({
					type: 'scorers' as const,
					code,
					scorers: data.scorers ?? []
				}))
			])
		);

		for (const result of results) {
			if (result.status === 'rejected') {
				console.error('[PREDICTOR] API call failed:', result.reason);
				continue;
			}

			const val = result.value;
			if (val.type === 'matches') {
				fixtures.push(...val.matches.map(mapMatch));
			} else if (val.type === 'standings') {
				standings.push(...val.entries.map((e) => mapStandingsEntry(e, val.code)));
			} else if (val.type === 'scorers') {
				leagueStars[val.code] = val.scorers.map((s) => ({
					id: s.player.id,
					name: s.player.name,
					goals: s.goals,
					teamId: s.team.id
				}));
			}
		}

		fixtures.sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

		return { fixtures, standings, leagueStars, liveError: null };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return {
			fixtures: [] as LiveFixture[],
			standings: [] as TeamStanding[],
			leagueStars: {} as Record<string, StarPlayer[]>,
			liveError: message
		};
	}
};
