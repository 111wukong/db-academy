import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from './db';
import { User, AuthResponse } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'db-academy-secret';
const SALT_ROUNDS = 10;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { userId: string; email: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; name: string };
  } catch {
    return null;
  }
}

export function registerUser(email: string, name: string, password: string): AuthResponse {
  const db = getDb();
  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);

  try {
    db.prepare(
      'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
    ).run(id, email.toLowerCase(), name, passwordHash);

    const user: User = { id, email: email.toLowerCase(), name, created_at: new Date().toISOString() };
    const token = generateToken(user);
    return { user, token };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE constraint')) {
      throw new Error('该邮箱已被注册');
    }
    throw new Error('注册失败');
  }
}

export function loginUser(email: string, password: string): AuthResponse {
  const db = getDb();
  const row = db.prepare(
    'SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?'
  ).get(email.toLowerCase()) as { id: string; email: string; name: string; password_hash: string; created_at: string } | undefined;

  if (!row) {
    throw new Error('邮箱或密码错误');
  }

  if (!verifyPassword(password, row.password_hash)) {
    throw new Error('邮箱或密码错误');
  }

  const user: User = { id: row.id, email: row.email, name: row.name, created_at: row.created_at };
  const token = generateToken(user);
  return { user, token };
}

export function getUserFromToken(token: string): User | null {
  const payload = verifyToken(token);
  if (!payload) return null;

  const db = getDb();
  const row = db.prepare(
    'SELECT id, email, name, created_at FROM users WHERE id = ?'
  ).get(payload.userId) as User | undefined;

  return row || null;
}
