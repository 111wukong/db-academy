import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';
import { Favorite } from '@/types';

// GET /api/favorites — list user's favorites
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();

  const favorites = db.prepare(`
    SELECT f.*,
      CASE
        WHEN f.item_type = 'lesson' THEN (SELECT title FROM lessons WHERE id = f.item_id)
        WHEN f.item_type = 'query' THEN (SELECT query FROM query_history WHERE id = f.item_id)
        ELSE NULL
      END as item_title
    FROM favorites f
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(userId);

  return NextResponse.json({ favorites });
}

// POST /api/favorites — add a favorite
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const { item_type, item_id } = await request.json();

  if (!item_type || !item_id) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  if (item_type !== 'lesson' && item_type !== 'query') {
    return NextResponse.json({ error: 'item_type 必须是 lesson 或 query' }, { status: 400 });
  }

  // Check if already favorited
  const existing = db.prepare(
    'SELECT id FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?'
  ).get(userId, item_type, item_id) as { id: string } | undefined;

  if (existing) {
    return NextResponse.json({ message: '已经收藏过了' });
  }

  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO favorites (id, user_id, item_type, item_id) VALUES (?, ?, ?, ?)'
  ).run(id, userId, item_type, item_id);

  return NextResponse.json({ id, message: '收藏成功' }, { status: 201 });
}

// DELETE /api/favorites — remove a favorite
export async function DELETE(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const item_type = searchParams.get('item_type');
  const item_id = searchParams.get('item_id');
  const favorite_id = searchParams.get('id');

  if (favorite_id) {
    // Delete by id
    db.prepare('DELETE FROM favorites WHERE id = ? AND user_id = ?')
      .run(favorite_id, userId);
  } else if (item_type && item_id) {
    // Delete by item
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?')
      .run(userId, item_type, item_id);
  } else {
    return NextResponse.json({ error: '请提供要取消收藏的 id 或 item_type+item_id' }, { status: 400 });
  }

  return NextResponse.json({ message: '已取消收藏' });
}
