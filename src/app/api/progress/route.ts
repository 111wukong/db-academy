import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';
import { UserProgress } from '@/types';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();

  // Get all modules with lesson counts and progress
  const modules = db.prepare(`
    SELECT
      m.id,
      m.title,
      m.description,
      m.order_index,
      m.difficulty,
      m.estimated_minutes,
      (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count,
      (SELECT COUNT(*) FROM user_progress up
       JOIN lessons l ON up.lesson_id = l.id
       WHERE l.module_id = m.id AND up.user_id = ? AND up.completed = 1) as completed_lessons
    FROM modules m
    ORDER BY m.order_index
  `).all(userId);

  return NextResponse.json({ modules });
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const { lesson_id, completed, quiz_score } = await request.json();

  if (!lesson_id) {
    return NextResponse.json({ error: '缺少 lesson_id' }, { status: 400 });
  }

  const existing = db.prepare(
    'SELECT id FROM user_progress WHERE user_id = ? AND lesson_id = ?'
  ).get(userId, lesson_id) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      'UPDATE user_progress SET completed = ?, quiz_score = ?, completed_at = ? WHERE id = ?'
    ).run(completed ? 1 : 0, quiz_score ?? null, completed ? new Date().toISOString() : null, existing.id);
  } else {
    db.prepare(
      'INSERT INTO user_progress (id, user_id, lesson_id, completed, quiz_score, completed_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(
      crypto.randomUUID(),
      userId,
      lesson_id,
      completed ? 1 : 0,
      quiz_score ?? null,
      completed ? new Date().toISOString() : null
    );
  }

  const progress = db.prepare(
    'SELECT lesson_id, completed as c, quiz_score, completed_at FROM user_progress WHERE user_id = ? AND lesson_id = ?'
  ).get(userId, lesson_id) as UserProgress | undefined;

  return NextResponse.json({ progress });
}
