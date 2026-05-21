import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';
import { Quiz } from '@/types';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lessonId');

  if (!lessonId) {
    return NextResponse.json({ error: '缺少 lessonId' }, { status: 400 });
  }

  const db = getDb();
  const quizzes = db.prepare(
    'SELECT * FROM quizzes WHERE lesson_id = ? ORDER BY order_index'
  ).all(lessonId) as Quiz[];

  // Parse options JSON
  const parsed = quizzes.map(q => ({
    ...q,
    options: JSON.parse(q.options as unknown as string),
  }));

  // Also return the lesson title
  const lesson = db.prepare('SELECT title FROM lessons WHERE id = ?').get(lessonId) as { title: string } | undefined;

  // Check if already completed
  const progress = db.prepare(
    'SELECT quiz_score FROM user_progress WHERE user_id = ? AND lesson_id = ?'
  ).get(userId, lessonId) as { quiz_score: number | null } | undefined;

  return NextResponse.json({
    lessonTitle: lesson?.title || '',
    quizzes: parsed,
    previousScore: progress?.quiz_score,
  });
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const { lesson_id, answers } = await request.json();

  if (!lesson_id || !answers) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 });
  }

  // Grade the quiz
  const quizzes = db.prepare(
    'SELECT id, correct_answer FROM quizzes WHERE lesson_id = ? ORDER BY order_index'
  ).all(lesson_id) as { id: string; correct_answer: number }[];

  let correct = 0;
  const total = quizzes.length;
  const details = quizzes.map((q, i) => {
    const isCorrect = answers[i] === q.correct_answer;
    if (isCorrect) correct++;
    return { quizId: q.id, isCorrect, correctAnswer: q.correct_answer };
  });

  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Save progress
  const existing = db.prepare(
    'SELECT id FROM user_progress WHERE user_id = ? AND lesson_id = ?'
  ).get(userId, lesson_id) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      'UPDATE user_progress SET completed = 1, quiz_score = ?, completed_at = ? WHERE id = ?'
    ).run(score, new Date().toISOString(), existing.id);
  } else {
    db.prepare(
      'INSERT INTO user_progress (id, user_id, lesson_id, completed, quiz_score, completed_at) VALUES (?, ?, ?, 1, ?, ?)'
    ).run(crypto.randomUUID(), userId, lesson_id, score, new Date().toISOString());
  }

  return NextResponse.json({
    score,
    correct,
    total,
    passed: score >= 60,
    details,
  });
}
