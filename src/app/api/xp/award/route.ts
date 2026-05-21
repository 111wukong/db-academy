import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';

// Badge definitions and their conditions
const BADGE_DEFINITIONS: Record<string, { label: string; icon: string; check: (db: any, userId: string) => boolean }> = {
  first_lesson: {
    label: '初出茅庐',
    icon: '🌟',
    check: (db, userId) => {
      const r = db.prepare('SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND completed = 1').get(userId) as { c: number };
      return r.c >= 1;
    },
  },
  five_lessons: {
    label: '学无止境',
    icon: '📚',
    check: (db, userId) => {
      const r = db.prepare('SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND completed = 1').get(userId) as { c: number };
      return r.c >= 5;
    },
  },
  all_sql_basics: {
    label: 'SQL 基础达人',
    icon: '💎',
    check: (db, userId) => {
      const basicsLessons = db.prepare(
        'SELECT l.id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.order_index = 1'
      ).all() as { id: string }[];
      if (basicsLessons.length === 0) return false;
      const completedBasics = db.prepare(
        'SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND completed = 1 AND lesson_id IN (' +
        basicsLessons.map(() => '?').join(',') + ')'
      ).get(userId, ...basicsLessons.map(l => l.id)) as { c: number };
      return completedBasics.c >= basicsLessons.length;
    },
  },
  quiz_master: {
    label: '测验大师',
    icon: '🏅',
    check: (db, userId) => {
      const r = db.prepare(
        'SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND completed = 1 AND quiz_score >= 100'
      ).get(userId) as { c: number };
      return r.c >= 3;
    },
  },
  seven_day_streak: {
    label: '坚持之星',
    icon: '🔥',
    check: (db, userId) => {
      const r = db.prepare('SELECT current_streak FROM daily_streaks WHERE user_id = ?').get(userId) as { current_streak: number } | undefined;
      return (r?.current_streak || 0) >= 7;
    },
  },
  first_challenge: {
    label: '挑战者',
    icon: '⚡',
    check: (db, userId) => {
      const r = db.prepare('SELECT COUNT(*) as c FROM challenge_attempts WHERE user_id = ? AND passed = 1').get(userId) as { c: number };
      return r.c >= 1;
    },
  },
  speed_demon: {
    label: '闪电手',
    icon: '💨',
    check: () => false, // Handled manually when submitting challenge
  },
  xp_collector_100: {
    label: '经验收集者 I',
    icon: '⭐',
    check: (db, userId) => {
      const r = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM xp_events WHERE user_id = ?').get(userId) as { total: number };
      return r.total >= 100;
    },
  },
  xp_collector_500: {
    label: '经验收集者 II',
    icon: '🌟',
    check: (db, userId) => {
      const r = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM xp_events WHERE user_id = ?').get(userId) as { total: number };
      return r.total >= 500;
    },
  },
  all_modules: {
    label: '全能学霸',
    icon: '👑',
    check: (db, userId) => {
      const modules_ = db.prepare('SELECT id FROM modules').all() as { id: string }[];
      if (modules_.length === 0) return false;
      let allCompleted = true;
      for (const m of modules_) {
        const lessons = db.prepare('SELECT id FROM lessons WHERE module_id = ?').all(m.id) as { id: string }[];
        if (lessons.length === 0) continue;
        const completed = db.prepare(
          'SELECT COUNT(*) as c FROM user_progress WHERE user_id = ? AND completed = 1 AND lesson_id IN (' +
          lessons.map(() => '?').join(',') + ')'
        ).get(userId, ...lessons.map(l => l.id)) as { c: number };
        if (completed.c < lessons.length) {
          allCompleted = false;
          break;
        }
      }
      return allCompleted;
    },
  },
};

function awardBadgeIfNotExists(db: any, userId: string, badgeType: string): boolean {
  const existing = db.prepare(
    'SELECT id FROM badges WHERE user_id = ? AND badge_type = ?'
  ).get(userId, badgeType) as { id: string } | undefined;
  if (existing) return false;

  db.prepare(
    'INSERT INTO badges (id, user_id, badge_type, badge_data, awarded_at) VALUES (?, ?, ?, ?, ?)'
  ).run(crypto.randomUUID(), userId, badgeType, JSON.stringify({ label: BADGE_DEFINITIONS[badgeType]?.label || badgeType }), new Date().toISOString());
  return true;
}

function checkAndAwardBadges(db: any, userId: string): string[] {
  const awarded: string[] = [];
  for (const [badgeType, def] of Object.entries(BADGE_DEFINITIONS)) {
    if (def.check(db, userId)) {
      if (awardBadgeIfNotExists(db, userId, badgeType)) {
        awarded.push(badgeType);
      }
    }
  }
  return awarded;
}

function updateStreak(db: any, userId: string): { current: number; longest: number } {
  const today = new Date().toISOString().slice(0, 10);
  const existing = db.prepare(
    'SELECT current_streak, longest_streak, last_active_date FROM daily_streaks WHERE user_id = ?'
  ).get(userId) as { current_streak: number; longest_streak: number; last_active_date: string } | undefined;

  if (!existing) {
    db.prepare(
      'INSERT INTO daily_streaks (user_id, current_streak, longest_streak, last_active_date) VALUES (?, 1, 1, ?)'
    ).run(userId, today);
    return { current: 1, longest: 1 };
  }

  if (existing.last_active_date === today) {
    return { current: existing.current_streak, longest: existing.longest_streak };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let newStreak = existing.last_active_date === yesterday ? existing.current_streak + 1 : 1;
  const newLongest = Math.max(newStreak, existing.longest_streak);

  db.prepare(
    'UPDATE daily_streaks SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE user_id = ?'
  ).run(newStreak, newLongest, today, userId);

  return { current: newStreak, longest: newLongest };
}

// Streak bonus calculation
function getStreakBonus(streak: number): number {
  if (streak >= 7) return 25;
  if (streak >= 3) return 10;
  return 0;
}

// XP_REWARDS mapping
export const XP_REWARDS = {
  complete_lesson: 10,
  quiz_pass: 15,    // >= 60
  quiz_excellent: 25, // >= 90
  complete_challenge: 30,
  daily_login: 5,
} as const;

// POST /api/xp/award — award XP (internal, protected)
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const { reason, amount } = await request.json();

  if (!reason || !amount || amount <= 0) {
    return NextResponse.json({ error: '无效的 XP 奖励参数' }, { status: 400 });
  }

  // Award XP
  const xpId = crypto.randomUUID();
  db.prepare(
    'INSERT INTO xp_events (id, user_id, amount, reason) VALUES (?, ?, ?, ?)'
  ).run(xpId, userId, amount, reason);

  // Update streak
  const streak = updateStreak(db, userId);

  // Check & award badges
  const badgeTypes = checkAndAwardBadges(db, userId);

  // Get new total
  const totalResult = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM xp_events WHERE user_id = ?'
  ).get(userId) as { total: number };

  const level = Math.floor(Math.sqrt(totalResult.total / 50)) + 1;

  return NextResponse.json({
    awarded: amount,
    reason,
    total_xp: totalResult.total,
    level,
    new_badges: badgeTypes.map(t => ({
      type: t,
      label: BADGE_DEFINITIONS[t]?.label || t,
      icon: BADGE_DEFINITIONS[t]?.icon || '🏆',
    })),
    streak,
  });
}
