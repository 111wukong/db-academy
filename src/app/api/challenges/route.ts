import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get('id');
  const difficulty = searchParams.get('difficulty');
  const moduleId = searchParams.get('module_id');
  const db = getDb();

  // Single challenge detail
  if (challengeId) {
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(challengeId) as Record<string, unknown> | undefined;
    if (!challenge) {
      return NextResponse.json({ error: '挑战不存在' }, { status: 404 });
    }

    // Get user's attempts
    const attempts = db.prepare(
      'SELECT passed, created_at FROM challenge_attempts WHERE user_id = ? AND challenge_id = ? ORDER BY created_at DESC LIMIT 5'
    ).all(userId, challengeId) as { passed: number; created_at: string }[];

    const lastAttempt = attempts.length > 0 ? attempts[0] : null;

    return NextResponse.json({
      challenge,
      attempts,
      passed: lastAttempt ? !!lastAttempt.passed : false,
    });
  }

  // List all challenges
  let query = `
    SELECT c.id, c.title, c.difficulty, c.module_id, c.order_index,
      COALESCE(
        (SELECT MAX(ca.passed) FROM challenge_attempts ca WHERE ca.challenge_id = c.id AND ca.user_id = ?),
        0
      ) as passed
    FROM challenges c
  `;
  const params: unknown[] = [userId];
  const conditions: string[] = [];

  if (difficulty) {
    conditions.push('c.difficulty = ?');
    params.push(difficulty);
  }
  if (moduleId) {
    conditions.push('c.module_id = ?');
    params.push(moduleId);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY c.order_index';

  const challenges = db.prepare(query).all(...params);

  // Total count
  const totalQuery = 'SELECT COUNT(*) as c FROM challenges' + (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '');
  const total = (db.prepare(totalQuery).get(...params.filter((_, i) => i > 0)) as { c: number }).c;

  // User stats
  const completed = (db.prepare(
    'SELECT COUNT(DISTINCT challenge_id) as c FROM challenge_attempts WHERE user_id = ? AND passed = 1'
  ).get(userId) as { c: number }).c;

  // Module titles
  const modules = db.prepare('SELECT id, title FROM modules').all() as { id: string; title: string }[];
  const moduleMap = Object.fromEntries(modules.map(m => [m.id, m.title]));

  return NextResponse.json({
    challenges,
    stats: { completed, total },
    modules: moduleMap,
  });
}
