import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const pathId = searchParams.get('id');
  const db = getDb();

  // Single path detail
  if (pathId) {
    const path_ = db.prepare('SELECT * FROM learning_paths WHERE id = ?').get(pathId) as Record<string, unknown> | undefined;
    if (!path_) {
      return NextResponse.json({ error: '学习路径不存在' }, { status: 404 });
    }

    // Get modules in this path with user progress
    const modules = db.prepare(`
      SELECT m.id, m.title, m.description, m.difficulty, m.estimated_minutes,
        pm.order_index, pm.required,
        (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count,
        (SELECT COUNT(*) FROM user_progress up
         JOIN lessons l ON up.lesson_id = l.id
         WHERE l.module_id = m.id AND up.user_id = ? AND up.completed = 1) as completed_lessons
      FROM path_modules pm
      JOIN modules m ON pm.module_id = m.id
      WHERE pm.path_id = ?
      ORDER BY pm.order_index
    `).all(userId, pathId) as Record<string, unknown>[];

    // Calculate path progress
    const totalLessons = modules.reduce((s: number, m: any) => s + m.lesson_count, 0);
    const completedLessons = modules.reduce((s: number, m: any) => s + m.completed_lessons, 0);
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return NextResponse.json({
      path: path_,
      modules,
      progress,
      completed_lessons: completedLessons,
      total_lessons: totalLessons,
    });
  }

  // List all paths with progress
  const paths = db.prepare(`
    SELECT lp.*,
      (SELECT COUNT(*) FROM path_modules pm2 JOIN modules m2 ON pm2.module_id = m2.id WHERE pm2.path_id = lp.id) as module_count,
      (SELECT COUNT(*) FROM path_modules pm3 JOIN modules m3 ON pm3.module_id = m3.id JOIN lessons l3 ON l3.module_id = m3.id WHERE pm3.path_id = lp.id) as total_lessons,
      (SELECT COUNT(*) FROM path_modules pm4 JOIN modules m4 ON pm4.module_id = m4.id JOIN lessons l4 ON l4.module_id = m4.id JOIN user_progress up4 ON up4.lesson_id = l4.id WHERE pm4.path_id = lp.id AND up4.user_id = ? AND up4.completed = 1) as completed_lessons
    FROM learning_paths lp
    ORDER BY lp.order_index
  `).all(userId);

  return NextResponse.json({ paths });
}
