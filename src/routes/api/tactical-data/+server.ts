import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FOOTBALL_API_KEY } from '$env/static/private';

const BASE_URL = 'https://api.football-data.org/v4';

// ── Cache Implementation ──
const tacticalCache: Record<string, { data: any; timestamp: number }> = {};
const TACTICAL_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchApi<T>(path: string, apiKey: string): Promise<T> {
	const now = Date.now();
	if (tacticalCache[path] && now - tacticalCache[path].timestamp < TACTICAL_TTL) {
		return tacticalCache[path].data as T;
	}

	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { 'X-Auth-Token': apiKey }
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`API ${res.status}: ${res.statusText} — ${body}`);
	}

	const data = await res.json();
	tacticalCache[path] = { data, timestamp: now };
	return data as T;
}

export const GET: RequestHandler = async ({ url }) => {
	const matchId = url.searchParams.get('matchId');
	const homeId = url.searchParams.get('homeId');
	const awayId = url.searchParams.get('awayId');

	if (!matchId || !homeId || !awayId) {
		return json({ error: 'Missing parameters' }, { status: 400 });
	}

	try {
		console.log(`[TACTICAL API] Requesting data for Match: ${matchId}, Home: ${homeId}, Away: ${awayId}`);
		
		// Fetch deep data in parallel
		// Note: Rate limit 10/min. This uses 3 calls.
		const [matchDetails, homeMatches, awayMatches] = await Promise.all([
			fetchApi<any>(`/matches/${matchId}`, FOOTBALL_API_KEY),
			fetchApi<any>(`/teams/${homeId}/matches?status=FINISHED&limit=5`, FOOTBALL_API_KEY),
			fetchApi<any>(`/teams/${awayId}/matches?status=FINISHED&limit=5`, FOOTBALL_API_KEY)
		]);

		console.log(`[TACTICAL API] Successfully fetched match and team data`);

		const homeLineup = matchDetails.homeTeam?.squad?.map((p: any) => p.name) || [];
		const awayLineup = matchDetails.awayTeam?.squad?.map((p: any) => p.name) || [];

		const mapHistory = (matches: any[], teamId: number) => {
			const list = Array.isArray(matches) ? [...matches].reverse() : [];
			return list.map((m: any) => {
				const isHome = m.homeTeam?.id === teamId;
				const opponent = isHome ? (m.awayTeam?.shortName || m.awayTeam?.name) : (m.homeTeam?.shortName || m.homeTeam?.name);
				const score = m.score?.fullTime || { home: 0, away: 0 };
				const teamGoals = isHome ? (score.home ?? 0) : (score.away ?? 0);
				const opponentGoals = isHome ? (score.away ?? 0) : (score.home ?? 0);
				
				let result: 'W' | 'D' | 'L' = 'D';
				if (teamGoals > opponentGoals) result = 'W';
				else if (teamGoals < opponentGoals) result = 'L';

				return {
					opponent: opponent || 'Unknown Unit',
					score: `${score.home ?? 0}-${score.away ?? 0}`,
					result,
					date: m.utcDate
				};
			});
		};

		// Calculate Extended Form Momentum
		const calcMomentum = (matches: any[], teamId: number) => {
			const list = Array.isArray(matches) ? [...matches].reverse() : [];
			if (list.length === 0) return 0;
			return list.reduce((acc, m, idx) => {
				const isHome = m.homeTeam?.id === teamId;
				const score = m.score?.fullTime || { home: 0, away: 0 };
				const goals = isHome ? (score.home ?? 0) : (score.away ?? 0);
				const conceded = isHome ? (score.away ?? 0) : (score.home ?? 0);
				const weight = (list.length - idx) / list.length; 
				return acc + (goals - conceded) * weight;
			}, 0);
		};

		const responseData = {
			homeLineup,
			awayLineup,
			homeMomentum: calcMomentum(homeMatches.matches, parseInt(homeId)),
			awayMomentum: calcMomentum(awayMatches.matches, parseInt(awayId)),
			homeHistory: mapHistory(homeMatches.matches, parseInt(homeId)),
			awayHistory: mapHistory(awayMatches.matches, parseInt(awayId)),
			h2h: matchDetails.head2head || null
		};

		console.log(`[TACTICAL API] Returning ${responseData.homeHistory.length} home matches and ${responseData.awayHistory.length} away matches`);
		return json(responseData);
	} catch (err: any) {
		console.error('[TACTICAL API] Error:', err.message);
		const status = err.message.includes('429') ? 429 : 500;
		const errorMsg = err.message.includes('429') 
			? 'Operational limit reached. Please wait 60 seconds.' 
			: 'Failed to synchronize tactical data.';
		return json({ error: errorMsg, details: err.message }, { status });
	}
};
