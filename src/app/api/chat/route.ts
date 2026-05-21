import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { queryDeepSeek, buildSystemPrompt } from '@/lib/deepseek';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const { message, context } = await request.json();

  if (!message) {
    return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
  }

  try {
    // Get recent chat history for context
    const recentHistory = db.prepare(`
      SELECT role, content FROM chat_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(userId) as { role: string; content: string }[];

    const messages = [
      { role: 'system' as const, content: buildSystemPrompt(context) },
      ...recentHistory.reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Save user message
    db.prepare(
      'INSERT INTO chat_history (id, user_id, role, content, module_context) VALUES (?, ?, ?, ?, ?)'
    ).run(crypto.randomUUID(), userId, 'user', message, context || null);

    const aiResponse = await queryDeepSeek(messages);

    // Save AI response
    db.prepare(
      'INSERT INTO chat_history (id, user_id, role, content, module_context) VALUES (?, ?, ?, ?, ?)'
    ).run(crypto.randomUUID(), userId, 'assistant', aiResponse, context || null);

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 服务异常' },
      { status: 500 }
    );
  }
}
