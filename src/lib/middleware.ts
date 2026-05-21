import { NextResponse } from 'next/server';
import { verifyToken } from './auth';

export function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  return payload?.userId || null;
}

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: '请先登录' },
    { status: 401 }
  );
}
