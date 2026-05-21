import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';
import { executeQuery } from '@/lib/sandbox';
import { XP_REWARDS } from '../../xp/award/route';

function normalizeResult(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows.map(r => Object.values(r)));
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const { challenge_id, sql } = await request.json();

  if (!challenge_id || !sql) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  // Get challenge
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challenge_id) as Record<string, unknown> | undefined;
  if (!challenge) {
    return NextResponse.json({ error: '挑战不存在' }, { status: 404 });
  }

  try {
    // Run user's SQL
    const userResult = executeQuery(sql);
    const userOutput = normalizeResult(userResult.rows);

    // Run expected SQL
    const expectedResult = executeQuery(challenge.expected_sql as string);
    const expectedOutput = normalizeResult(expectedResult.rows);

    const passed = userOutput === expectedOutput;

    // Save attempt
    db.prepare(
      'INSERT INTO challenge_attempts (id, user_id, challenge_id, submitted_sql, passed) VALUES (?, ?, ?, ?, ?)'
    ).run(crypto.randomUUID(), userId, challenge_id, sql, passed ? 1 : 0);

    let xpAwarded = 0;
    let newBadges: { type: string; label: string; icon: string }[] = [];

    if (passed) {
      xpAwarded = XP_REWARDS.complete_challenge;

      // Award XP
      const xpId = crypto.randomUUID();
      db.prepare(
        'INSERT INTO xp_events (id, user_id, amount, reason) VALUES (?, ?, ?, ?)'
      ).run(xpId, userId, xpAwarded, `完成挑战: ${challenge.title}`);

      // Check badges
      const badgeChecks = [
        { type: 'first_challenge', check: () => {
          const r = db.prepare('SELECT COUNT(*) as c FROM challenge_attempts WHERE user_id = ? AND passed = 1').get(userId) as { c: number };
          return r.c >= 1;
        }},
      ];

      for (const bc of badgeChecks) {
        if (bc.check()) {
          const existing = db.prepare('SELECT id FROM badges WHERE user_id = ? AND badge_type = ?').get(userId, bc.type) as { id: string } | undefined;
          if (!existing) {
            db.prepare(
              'INSERT INTO badges (id, user_id, badge_type, badge_data, awarded_at) VALUES (?, ?, ?, ?, ?)'
            ).run(crypto.randomUUID(), userId, bc.type, JSON.stringify({}), new Date().toISOString());
            newBadges.push({ type: bc.type, label: '挑战者', icon: '⚡' });
          }
        }
      }

      // Check XP badges
      const xpTotal = (db.prepare('SELECT COALESCE(SUM(amount), 0) as t FROM xp_events WHERE user_id = ?').get(userId) as { t: number }).t;
      if (xpTotal >= 100) {
        const existing = db.prepare('SELECT id FROM badges WHERE user_id = ? AND badge_type = ?').get(userId, 'xp_collector_100') as { id: string } | undefined;
        if (!existing) {
          db.prepare(
            'INSERT INTO badges (id, user_id, badge_type, badge_data, awarded_at) VALUES (?, ?, ?, ?, ?)'
          ).run(crypto.randomUUID(), userId, 'xp_collector_100', JSON.stringify({}), new Date().toISOString());
          newBadges.push({ type: 'xp_collector_100', label: '经验收集者 I', icon: '⭐' });
        }
      }
      if (xpTotal >= 500) {
        const existing = db.prepare('SELECT id FROM badges WHERE user_id = ? AND badge_type = ?').get(userId, 'xp_collector_500') as { id: string } | undefined;
        if (!existing) {
          db.prepare(
            'INSERT INTO badges (id, user_id, badge_type, badge_data, awarded_at) VALUES (?, ?, ?, ?, ?)'
          ).run(crypto.randomUUID(), userId, 'xp_collector_500', JSON.stringify({}), new Date().toISOString());
          newBadges.push({ type: 'xp_collector_500', label: '经验收集者 II', icon: '🌟' });
        }
      }
    }

    return NextResponse.json({
      passed,
      actual_output: userResult.rows.slice(0, 20),
      expected_output: expectedResult.rows.slice(0, 20),
      columns: userResult.columns,
      xp_awarded: xpAwarded,
      new_badges: newBadges,
    });
  } catch (error) {
    return NextResponse.json({
      passed: false,
      error: error instanceof Error ? error.message : '执行出错',
      actual_output: null,
      expected_output: null,
      columns: [],
    });
  }
}
