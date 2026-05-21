'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { AuthProvider, authFetch } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import { useSearchParams, useRouter } from 'next/navigation';
import { QueryResult } from '@/types';

interface SavedQuery {
  id: string;
  item_id: string;
  item_title: string | null;
  item_type: string;
  created_at: string;
}

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState('');
  const [executing, setExecuting] = useState(false);
  const [history, setHistory] = useState<{ query: string }[]>([]);
  const [showTables, setShowTables] = useState(false);
  const [favorites, setFavorites] = useState<SavedQuery[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const checkAuth = localStorage.getItem('db_academy_token');
    if (!checkAuth) {
      router.push('/login');
      return;
    }
    const sqlParam = searchParams.get('sql');
    if (sqlParam) {
      setSql(decodeURIComponent(sqlParam));
    }
    // Load history
    const saved = localStorage.getItem('db_academy_query_history');
    if (saved) {
      try { setHistory(JSON.parse(saved).slice(0, 20)); } catch {}
    }
    // Load favorites
    loadFavorites();
  }, [searchParams, router]);

  const loadFavorites = async () => {
    try {
      const res = await authFetch('/api/favorites');
      const data = await res.json();
      if (data.favorites) {
        setFavorites(data.favorites.filter((f: SavedQuery) => f.item_type === 'query'));
      }
    } catch {}
  };

  const handleSaveQuery = async () => {
    if (!sql.trim()) return;
    setSaveMsg(null);
    try {
      // First save the query to history server-side
      const queryRes = await authFetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sql.trim() }),
      });
      const queryData = await queryRes.json();

      // Extract query_history ID from the result
      const favRes = await authFetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'query',
          // Use a hash of the query as item_id since we don't have the history id from the response
          item_id: `q_${sql.trim().slice(0, 20).replace(/\s+/g, '_')}`,
        }),
      });

      if (favRes.ok) {
        setSaveMsg({ type: 'success', text: '✅ 查询已收藏' });
        loadFavorites();
      } else {
        const data = await favRes.json();
        if (data.message === '已经收藏过了') {
          setSaveMsg({ type: 'success', text: '📌 已经收藏过了' });
        } else {
          setSaveMsg({ type: 'error', text: '❌ 收藏失败' });
        }
      }
    } catch {
      setSaveMsg({ type: 'error', text: '❌ 保存失败' });
    }

    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleExecute = useCallback(async () => {
    if (!sql.trim()) return;
    setError('');
    setExecuting(true);

    try {
      const res = await authFetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sql.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('请求失败');
    } finally {
      setExecuting(false);
    }

    // Update history
    const newHistory = [{ query: sql.trim() }, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem('db_academy_query_history', JSON.stringify(newHistory));
  }, [sql, history]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleDownloadCSV = () => {
    if (!result || result.rows.length === 0) return;

    const headers = result.columns.join(',');
    const rows = result.rows.map(row =>
      result.columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Escape CSV
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemoveFavorite = async (favId: string) => {
    try {
      await authFetch(`/api/favorites?id=${favId}`, { method: 'DELETE' });
      loadFavorites();
    } catch {}
  };

  const tables = [
    {
      name: 'sandbox_employees',
      desc: '员工信息表',
      fields: ['id', 'name', 'department', 'salary', 'hire_date'],
    },
    {
      name: 'sandbox_products',
      desc: '商品表',
      fields: ['id', 'name', 'category', 'price', 'stock'],
    },
    {
      name: 'sandbox_customers',
      desc: '客户表',
      fields: ['id', 'name', 'email', 'city', 'signup_date'],
    },
    {
      name: 'sandbox_orders',
      desc: '订单表',
      fields: ['id', 'customer_id', 'product_id', 'quantity', 'order_date', 'total'],
    },
    {
      name: 'sandbox_courses',
      desc: '课程表',
      fields: ['id', 'name', 'teacher', 'credits', 'department'],
    },
    {
      name: 'sandbox_enrollments',
      desc: '选课成绩表',
      fields: ['id', 'student_id', 'course_id', 'grade', 'semester'],
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">💻 SQL 练习场</h1>
          <p className="text-slate-500 mt-1">编写 SQL 查询语句并在沙箱环境中运行</p>
        </div>
        <div className="flex items-center gap-2">
          {result && result.rows.length > 0 && (
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              📥 下载 CSV
            </button>
          )}
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
              showFavorites
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-yellow-300 hover:text-yellow-600'
            }`}
          >
            ⭐ 收藏 {favorites.length > 0 && `(${favorites.length})`}
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Database Schema */}
          <div className="mb-4">
            <button
              onClick={() => setShowTables(!showTables)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showTables ? '收起' : '查看'}数据表结构 {showTables ? '▲' : '▼'}
            </button>
            {showTables && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {tables.map(table => (
                  <div key={table.name} className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="font-mono text-sm font-semibold text-blue-700 mb-1">{table.name}</div>
                    <div className="text-xs text-slate-500 mb-2">{table.desc}</div>
                    <div className="text-xs font-mono text-slate-600">
                      ({table.fields.join(', ')})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SQL Editor */}
          <div className="bg-slate-900 rounded-xl overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
              <span className="text-xs text-slate-400 font-mono">SQL 查询</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveQuery}
                  disabled={!sql.trim()}
                  className="px-3 py-1 bg-slate-700 text-white text-xs rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="保存查询到收藏"
                >
                  ⭐ 收藏
                </button>
                <span className="text-xs text-slate-500">⌘+Enter 执行</span>
                <button
                  onClick={handleExecute}
                  disabled={executing || !sql.trim()}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {executing ? '执行中...' : '▶ 运行'}
                </button>
              </div>
            </div>
            <textarea
              value={sql}
              onChange={e => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              className="sql-editor w-full h-40 p-4 bg-slate-900 text-green-400 text-sm font-mono border-none outline-none resize-y"
              placeholder="SELECT * FROM sandbox_employees;"
              spellCheck={false}
            />
          </div>

          {/* Save message toast */}
          {saveMsg && (
            <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${
              saveMsg.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {saveMsg.text}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: '查所有员工', sql: 'SELECT * FROM sandbox_employees;' },
              { label: '平均工资', sql: 'SELECT department, AVG(salary) as avg_salary FROM sandbox_employees GROUP BY department;' },
              { label: '客户订单', sql: 'SELECT c.name, p.name AS product, o.total FROM sandbox_orders o JOIN sandbox_customers c ON o.customer_id = c.id JOIN sandbox_products p ON o.product_id = p.id;' },
              { label: '热销商品', sql: 'SELECT p.name, SUM(o.quantity) as total_sold FROM sandbox_products p JOIN sandbox_orders o ON p.id = o.product_id GROUP BY p.name ORDER BY total_sold DESC;' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => setSql(item.sql)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <div className="font-medium mb-1">⚠️ 查询出错</div>
              <div className="font-mono text-xs">{error}</div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
                <span className="text-sm text-slate-600">
                  查询结果 · {result.rowCount} 行 · {result.executionTime}ms
                </span>
              </div>
              <div className="overflow-x-auto sql-result">
                {result.columns.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th className="text-xs">#</th>
                        {result.columns.map(col => (
                          <th key={col} className="text-xs">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          <td className="text-xs text-slate-400">{i + 1}</td>
                          {result.columns.map(col => (
                            <td key={col} className="text-sm">
                              {row[col] !== null ? String(row[col]) : <span className="text-slate-300">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">查询完成，无数据返回</div>
                )}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">最近查询</h3>
              <div className="space-y-1">
                {history.slice(0, 5).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSql(item.query)}
                    className="block w-full text-left px-3 py-2 bg-white border border-slate-100 rounded-lg text-xs font-mono text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-colors truncate"
                  >
                    {item.query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Favorites sidebar */}
        {showFavorites && (
          <div className="w-64 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700">⭐ 收藏的查询</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {favorites.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    还没有收藏的查询<br />
                    执行查询后点击「收藏」按钮
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {favorites.map((fav) => (
                      <div key={fav.id} className="p-3 group hover:bg-slate-50">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => setSql(fav.item_title || '')}
                            className="flex-1 min-w-0 text-left"
                          >
                            <p className="text-xs font-mono text-slate-600 truncate">
                              {fav.item_title || '查询'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(fav.created_at).toLocaleDateString('zh-CN')}
                            </p>
                          </button>
                          <button
                            onClick={() => handleRemoveFavorite(fav.id)}
                            className="text-xs text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            title="取消收藏"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlaygroundPageInner() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400">加载中...</div>}>
      <PlaygroundContent />
    </Suspense>
  );
}

export default function PlaygroundPage() {
  return (
    <AuthProvider>
      <AppShell>
        <PlaygroundPageInner />
      </AppShell>
    </AuthProvider>
  );
}
