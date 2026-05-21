'use client';

import { useState, useRef, useEffect } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

function ChatContent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `# 👋 你好！我是 DB Academy 的 AI 学习助手

我可以帮助你学习数据库知识，你可以问我：

- 📖 **概念解释** — 什么是事务？什么是索引？
- 💻 **SQL 问题** — 怎么写 JOIN？怎么优化查询？
- 🔍 **练习辅导** — 出个 SQL 练习题
- ⚡ **面试准备** — 数据库面试常见问题

现在开始提问吧！`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await authFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, context }),
      });
      const data = await res.json();

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || '抱歉，暂时无法回答。',
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '⚠️ 网络错误，请稍后重试。',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    '什么是数据库事务的 ACID 特性？',
    'SQL 中 INNER JOIN 和 LEFT JOIN 有什么区别？',
    '什么是数据库索引？有什么用？',
    '给我出一道 SQL 练习题',
    '第一范式、第二范式、第三范式有什么区别？',
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">🤖 AI 辅导</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">随时提问，AI 帮你学数据库</p>
          </div>
          <select
            value={context}
            onChange={e => setContext(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            <option value="">通用模式</option>
            <option value="SQL 基础">SQL 基础</option>
            <option value="数据库设计">数据库设计</option>
            <option value="索引与优化">索引与优化</option>
            <option value="事务与并发">事务与并发</option>
            <option value="NoSQL">NoSQL</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm shrink-0 mt-1">
                  AI
                </div>
              )}
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="markdown-content text-sm dark:text-slate-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm shrink-0 mt-1">
                  U
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm shrink-0">
                AI
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-blue-400 rounded-full loading-dot" />
                  <span className="w-2 h-2 bg-blue-400 rounded-full loading-dot" />
                  <span className="w-2 h-2 bg-blue-400 rounded-full loading-dot" />
                </div>
              </div>
            </div>
          )}

          {/* Suggested questions */}
          {messages.length === 1 && (
            <div className="mt-6">
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-3">试试这些问题：</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); }}
                    className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的数据库问题..."
            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl resize-none text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthProvider>
      <AppShell>
        <ChatContent />
      </AppShell>
    </AuthProvider>
  );
}
