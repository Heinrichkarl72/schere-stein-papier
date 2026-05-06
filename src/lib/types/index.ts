// ── Game Core Types ──

export type Move = 'rock' | 'paper' | 'scissors';
export type Result = 'win' | 'loss' | 'draw';

// ── Database Models ──

export interface Operative {
	id: string;
	callsign: string;
	avatar_url?: string;
	title?: string;
	active_skin?: string;
	created_at: string;
}

export interface GameSession {
	id: string;
	operative_id: string;
	player_move: Move;
	bot_move: Move;
	result: Result;
	created_at?: string;
}

export interface OperativeStats {
	operative_id: string;
	wins: number;
	losses: number;
	draws: number;
}
