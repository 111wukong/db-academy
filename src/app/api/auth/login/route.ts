import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '请填写邮箱和密码' },
        { status: 400 }
      );
    }

    const result = loginUser(email.trim(), password);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '登录失败' },
      { status: 401 }
    );
  }
}
