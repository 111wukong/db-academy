import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';

// GET /api/xp — get user XP total, level, badges, streak
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();

  // Total XP
  const xpResult = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total_xp FROM xp_events WHERE user_id = ?'
  ).get(userId) as { total_xp: number };

  const totalXp = xpResult.total_xp;

  // Level formula: Level = floor(sqrt(XP / 50)) + 1
  const level = Math.floor(Math.sqrt(totalXp / 50)) + 1;
  const nextLevelXp = Math.pow(level, 2) * 50;
  const currentLevelXp = Math.pow(level - 1, 2) * 50;
  const xpProgress = nextLevelXp > currentLevelXp
    ? Math.round(((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)
    : 0;

  // Badges
  const badges = db.prepare(
    'SELECT badge_type, awarded_at FROM badges WHERE user_id = ? ORDER BY awarded_at'
  ).all(userId) as { badge_type: string; awarded_at: string }[];

  // Streak
  const streak = db.prepare(
    'SELECT current_streak, longest_streak, last_active_date FROM daily_streaks WHERE user_id = ?'
  ).get(userId) as { current_streak: number; longest_streak: number; last_active_date: string } | undefined;

  return NextResponse.json({
    total_xp: totalXp,
    level,
    xp_progress: xpProgress,
    next_level_xp: nextLevelXp,
    current_level_xp: currentLevelXp,
    badges,
    streak: streak || { current_streak: 0, longest_streak: 0, last_active_date: null },
  });
}
