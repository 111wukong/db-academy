import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/sandbox';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const { sql } = await request.json();

  if (!sql || typeof sql !== 'string') {
    return NextResponse.json({ error: 'SQL 语句不能为空' }, { status: 400 });
  }

  try {
    const result = executeQuery(sql);

    // Save to history
    db.prepare(
      'INSERT INTO query_history (id, user_id, query, result, error) VALUES (?, ?, ?, ?, ?)'
    ).run(
      crypto.randomUUID(),
      userId,
      sql,
      JSON.stringify(result),
      null
    );

    return NextResponse.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : '查询执行失败';

    // Save error to history
    db.prepare(
      'INSERT INTO query_history (id, user_id, query, result, error) VALUES (?, ?, ?, ?, ?)'
    ).run(crypto.randomUUID(), userId, sql, null, errorMsg);

    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
