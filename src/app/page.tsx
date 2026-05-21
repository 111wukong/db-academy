'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('db_academy_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      {/* Navbar */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">
            DB
          </div>
          <span className="text-white font-semibold">DB Academy</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            登录
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            开始学习
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            掌握数据库，从<span className="text-blue-400">这里</span>开始
          </h1>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed">
            面向大学生的数据库在线学习平台。AI 辅导、在线 SQL 练习、系统化课程，
            <br />帮你从入门到精通关系型数据库。
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
          >
            免费开始学习 →
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mt-24">
          {[
            {
              icon: '🤖',
              title: 'AI 智能辅导',
              desc: '遇到问题随时问 AI 助手，即时解答你的数据库疑惑。',
            },
            {
              icon: '💻',
              title: '在线 SQL 练习',
              desc: '内置沙箱环境，边学边练，零配置上手 SQL。',
            },
            {
              icon: '📚',
              title: '系统化课程',
              desc: '从 SQL 基础到事务、索引、范式，体系化学习路径。',
            },
            {
              icon: '📝',
              title: '互动测验',
              desc: '每课配套测验，即时反馈，巩固所学知识。',
            },
            {
              icon: '📊',
              title: '学习进度',
              desc: '清晰的进度追踪，随时了解自己的学习情况。',
            },
            {
              icon: '🎯',
              title: '面向求职',
              desc: '覆盖数据库面试常见考点，助力 Offer 之路。',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-32 text-center text-sm text-slate-500">
          <p>DB Academy — 大学生数据库学习平台</p>
        </footer>
      </div>
    </div>
  );
}
