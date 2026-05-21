import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get('moduleId');

  const db = getDb();

  if (moduleId) {
    // Get specific module with lessons
    const module_ = db.prepare('SELECT * FROM modules WHERE id = ?').get(moduleId) as Record<string, unknown> | undefined;
    if (!module_) {
      return NextResponse.json({ error: '模块不存在' }, { status: 404 });
    }

    const lessons = db.prepare(`
      SELECT l.*,
        COALESCE(up.completed, 0) as completed,
        up.quiz_score
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = ?
      WHERE l.module_id = ?
      ORDER BY l.order_index
    `).all(userId, moduleId);

    return NextResponse.json({ module: module_, lessons });
  }

  // Get all modules
  const modules = db.prepare(`
    SELECT m.*,
      (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count
    FROM modules m
    ORDER BY m.order_index
  `).all();

  return NextResponse.json({ modules });
}
