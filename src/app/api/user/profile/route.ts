import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const viewerId = getUserIdFromRequest(request);
  if (!viewerId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少 userId 参数' }, { status: 400 });
  }

  const db = getDb();

  // Get user info
  const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  // Get XP
  const xpResult = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM xp_events WHERE user_id = ?'
  ).get(userId) as { total: number };

  const totalXp = xpResult.total;
  const level = Math.floor(Math.sqrt(totalXp / 50)) + 1;

  // Get badges
  const badges = db.prepare(
    'SELECT badge_type, badge_data, awarded_at FROM badges WHERE user_id = ? ORDER BY awarded_at'
  ).all(userId) as { badge_type: string; badge_data: string; awarded_at: string }[];

  // Module completion
  const modules = db.prepare(`
    SELECT m.id, m.title,
      (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count,
      (SELECT COUNT(*) FROM user_progress up
       JOIN lessons l ON up.lesson_id = l.id
       WHERE l.module_id = m.id AND up.user_id = ? AND up.completed = 1) as completed_lessons
    FROM modules m
    ORDER BY m.order_index
  `).all(userId) as { id: string; title: string; lesson_count: number; completed_lessons: number }[];

  const totalLessons = modules.reduce((s, m) => s + m.lesson_count, 0);
  const completedLessons = modules.reduce((s, m) => s + m.completed_lessons, 0);

  // Challenges solved
  const challengesSolved = (db.prepare(
    'SELECT COUNT(DISTINCT challenge_id) as c FROM challenge_attempts WHERE user_id = ? AND passed = 1'
  ).get(userId) as { c: number }).c;

  // Quiz stats
  const quizResult = db.prepare(
    'SELECT COUNT(*) as total, AVG(quiz_score) as avg_score FROM user_progress WHERE user_id = ? AND quiz_score IS NOT NULL'
  ).get(userId) as { total: number; avg_score: number | null };

  // Recent activity
  const recentActivity = db.prepare(`
    SELECT 'lesson' as type, l.title as label, up.completed_at as time
    FROM user_progress up
    JOIN lessons l ON up.lesson_id = l.id
    WHERE up.user_id = ? AND up.completed = 1
    ORDER BY up.completed_at DESC
    LIMIT 5
  `).all(userId) as { type: string; label: string; time: string }[];

  // Streak
  const streak = db.prepare(
    'SELECT current_streak, longest_streak FROM daily_streaks WHERE user_id = ?'
  ).get(userId) as { current_streak: number; longest_streak: number } | undefined;

  // Settings (display_name, bio)
  const settings = db.prepare(
    'SELECT display_name, bio FROM user_settings WHERE user_id = ?'
  ).get(userId) as { display_name: string; bio: string } | undefined;

  return NextResponse.json({
    profile: {
      name: (settings?.display_name || user.name) as string,
      bio: settings?.bio || '',
      level,
      total_xp: totalXp,
      badges,
      modules_completed: completedLessons,
      total_lessons: totalLessons,
      challenges_solved: challengesSolved,
      quiz_count: quizResult.total,
      quiz_avg_score: Math.round((quizResult.avg_score || 0) * 10) / 10,
      streak: streak || { current_streak: 0, longest_streak: 0 },
      recent_activity: recentActivity,
      member_since: user.created_at as string,
    },
  });
}
