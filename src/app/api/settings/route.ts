import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/middleware';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { Settings } from '@/types';

// GET /api/settings — get user settings
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();

  // Try to get existing settings
  let settings = db.prepare(
    'SELECT * FROM user_settings WHERE user_id = ?'
  ).get(userId) as Settings | undefined;

  // Create default settings if not exist
  if (!settings) {
    const id = crypto.randomUUID();
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;

    db.prepare(
      'INSERT INTO user_settings (id, user_id, dark_mode, display_name, bio) VALUES (?, ?, 0, ?, ?)'
    ).run(id, userId, user?.name || '用户', '');

    settings = {
      id,
      user_id: userId,
      dark_mode: false,
      display_name: user?.name || '用户',
      bio: '',
    };
  }

  return NextResponse.json({ settings });
}

// PATCH /api/settings — update settings
export async function PATCH(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const body = await request.json();
  const { display_name, bio, dark_mode } = body;

  // Check settings exist
  let existing = db.prepare('SELECT id FROM user_settings WHERE user_id = ?').get(userId) as { id: string } | undefined;

  if (!existing) {
    // Create first
    const id = crypto.randomUUID();
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined;
    db.prepare(
      'INSERT INTO user_settings (id, user_id, dark_mode, display_name, bio) VALUES (?, ?, ?, ?, ?)'
    ).run(id, userId, dark_mode ? 1 : 0, display_name || user?.name || '用户', bio || '');
    existing = { id };
  } else {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (display_name !== undefined) {
      updates.push('display_name = ?');
      params.push(display_name);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }
    if (dark_mode !== undefined) {
      updates.push('dark_mode = ?');
      params.push(dark_mode ? 1 : 0);
    }

    if (updates.length > 0) {
      params.push(existing.id);
      db.prepare(`UPDATE user_settings SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }
  }

  // Return updated settings
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
  return NextResponse.json({ settings });
}

// POST /api/settings — change password
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return unauthorized();

  const db = getDb();
  const { old_password, new_password } = await request.json();

  if (!old_password || !new_password) {
    return NextResponse.json({ error: '请提供原密码和新密码' }, { status: 400 });
  }

  if (new_password.length < 6) {
    return NextResponse.json({ error: '新密码长度不能少于 6 位' }, { status: 400 });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined;

  if (!user || !verifyPassword(old_password, user.password_hash)) {
    return NextResponse.json({ error: '原密码错误' }, { status: 400 });
  }

  const newHash = hashPassword(new_password);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);

  return NextResponse.json({ message: '密码修改成功' });
}
