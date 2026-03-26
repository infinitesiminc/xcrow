/**
 * Credit cost configuration — maps actions to credit costs.
 * Costs are also stored in DB (credit_costs table) but this provides
 * fast client-side lookup with fallbacks.
 */

export interface CreditAction {
  action: string;
  cost: number;
  label: string;
  emoji: string;
}

export const CREDIT_ACTIONS: Record<string, CreditAction> = {
  simulation_l1: { action: "simulation_l1", cost: 1, label: "Level 1 Quest", emoji: "⚔️" },
  simulation_l2: { action: "simulation_l2", cost: 2, label: "Boss Battle", emoji: "🐉" },
  prompt_lab:    { action: "prompt_lab",    cost: 1, label: "Prompt Lab", emoji: "🧪" },
  role_analysis: { action: "role_analysis", cost: 0, label: "Role Analysis", emoji: "📊" },
  career_chat:   { action: "career_chat",   cost: 1, label: "Career Scout", emoji: "🗺️" },
  npc_duel:      { action: "npc_duel",      cost: 1, label: "NPC Duel", emoji: "⚔️" },
};

/** Get cost for an action, defaulting to 1 if unknown */
export function getCreditCost(action: string): number {
  return CREDIT_ACTIONS[action]?.cost ?? 1;
}

/** Free daily credits for non-Pro users */
export const FREE_DAILY_CREDITS = 5;

/** Credits granted on signup */
export const SIGNUP_BONUS_CREDITS = 20;

/** Credits granted per referral */
export const REFERRAL_BONUS_CREDITS = 10;

/** Champion plan monthly credit allowance */
export const CHAMPION_MONTHLY_CREDITS = 999;
