import { getDb } from './db';
import { QueryResult } from '@/types';

export function executeQuery(sql: string): QueryResult {
  const db = getDb();
  const startTime = performance.now();

  // Safety: only allow SELECT and EXPLAIN queries in sandbox
  const trimmed = sql.trim().toUpperCase();
  if (
    !trimmed.startsWith('SELECT') &&
    !trimmed.startsWith('EXPLAIN') &&
    !trimmed.startsWith('WITH')
  ) {
    throw new Error('⚠️ 练习模式下只允许执行 SELECT 和 WITH 查询');
  }

  // Block dangerous patterns
  const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'PRAGMA'];
  for (const word of dangerous) {
    if (trimmed.startsWith(word)) {
      // Only let through if it's a CTE with SELECT
      if (word !== 'SELECT' && !trimmed.startsWith('WITH')) {
        throw new Error(`⚠️ 不允许执行 ${word} 操作，仅支持查询操作`);
      }
    }
  }

  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all() as Record<string, unknown>[];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const executionTime = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      columns,
      rows,
      rowCount: rows.length,
      executionTime,
    };
  } catch (error) {
    throw new Error(
      `SQL 执行错误: ${error instanceof Error ? error.message : '未知错误'}`
    );
  }
}
