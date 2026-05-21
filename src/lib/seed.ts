import { getDb, seedSandboxData } from './db';

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

export function seedDatabase(): void {
  const db = getDb();
  seedSandboxData();

  const moduleCount = db.prepare('SELECT COUNT(*) as c FROM modules').get() as { c: number };
  if (moduleCount.c > 0) {
    console.log('📚 Database already seeded, skipping...');
    return;
  }

  const tx = db.transaction(() => {
    // ====================================================================
    // MODULE 1: SQL 基础入门 — 6 lessons / 14 quizzes
    // ====================================================================
    const m1 = generateId('mod');
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m1, 'SQL 基础入门', '从零开始学习 SQL，掌握数据库查询的核心技能', 1, 'beginner', 60);

    // L1-1: 什么是 SQL？
    insertLesson(m1, '什么是 SQL？', sqlIntroContent(), 1, 'SELECT * FROM sandbox_employees;', [
      { q: 'SQL 的全称是什么？', opts: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'Structured Question Language'], ans: 0, exp: 'SQL 的全称是 Structured Query Language（结构化查询语言）。' },
      { q: '下面哪个不是 SQL 的主要功能？', opts: ['数据查询（SELECT）', '数据定义（CREATE）', '文件压缩', '数据控制（GRANT）'], ans: 2, exp: 'SQL 的主要功能包括数据查询、数据操作、数据定义和数据控制，不涉及文件压缩。' },
    ]);

    // L1-2: SELECT 查询基础
    insertLesson(m1, 'SELECT 查询基础', selectBasicsContent(), 2, 'SELECT name, salary FROM sandbox_employees WHERE salary > 10000 ORDER BY salary DESC;', [
      { q: '以下哪个子句用于在 SQL 中过滤数据？', opts: ['WHERE', 'HAVING', 'FILTER', 'ORDER BY'], ans: 0, exp: 'WHERE 子句用于在 SQL 查询中过滤行数据。' },
      { q: 'ORDER BY 的默认排序方式是什么？', opts: ['ASC（升序）', 'DESC（降序）', '随机', '不排序'], ans: 0, exp: 'ORDER BY 默认使用 ASC（升序）排序。' },
    ]);

    // L1-3: 聚合函数与 GROUP BY
    insertLesson(m1, '聚合函数与 GROUP BY', aggregateContent(), 3, 'SELECT department, AVG(salary) as avg_salary FROM sandbox_employees GROUP BY department;', [
      { q: '计算某列平均值的聚合函数是？', opts: ['AVG()', 'SUM()', 'COUNT()', 'MEAN()'], ans: 0, exp: 'AVG() 函数计算指定列的平均值。' },
      { q: '想要过滤分组后的结果，应该使用哪个子句？', opts: ['WHERE', 'HAVING', 'FILTER', 'GROUP FILTER'], ans: 1, exp: 'HAVING 子句用于过滤 GROUP BY 后的分组结果，WHERE 在分组前过滤。' },
      { q: 'COUNT(*) 统计的是什么？', opts: ['非空值的数量', '表的总行数', '去重后的行数', '数值列的和'], ans: 1, exp: 'COUNT(*) 统计表中的总行数，包括 NULL 值。' },
    ]);

    // L1-4: 多表连接 JOIN
    insertLesson(m1, '多表连接 JOIN', joinContent(), 4, `SELECT c.name, p.name AS product, o.quantity, o.total
FROM sandbox_orders o
JOIN sandbox_customers c ON o.customer_id = c.id
JOIN sandbox_products p ON o.product_id = p.id;`, [
      { q: '哪种 JOIN 只返回两个表中匹配的行？', opts: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], ans: 0, exp: 'INNER JOIN 只返回两个表中满足连接条件的匹配行。' },
      { q: 'LEFT JOIN 中，若右表没有匹配行，右表列的值是什么？', opts: ['0', 'NULL', '空字符串', '抛出错误'], ans: 1, exp: 'LEFT JOIN 在右表没有匹配时，右表的列会填充为 NULL。' },
    ]);

    // L1-5: 子查询与 EXISTS (NEW)
    insertLesson(m1, '子查询与 EXISTS', subqueryContent(), 5, `SELECT name, salary FROM sandbox_employees
WHERE salary > (SELECT AVG(salary) FROM sandbox_employees);`, [
      { q: '以下哪个运算符用于检查子查询是否返回任何行？', opts: ['EXISTS', 'IN', 'ANY', 'ALL'], ans: 0, exp: 'EXISTS 检查子查询是否至少返回一行数据。' },
      { q: '标量子查询返回的结果是？', opts: ['一个表', '单个值', '多行多列', '布尔值'], ans: 1, exp: '标量子查询返回单个值，可以用在 SELECT 列表或 WHERE 比较中。' },
      { q: '子查询可以出现在以下哪个子句中？', opts: ['SELECT', 'FROM', 'WHERE', '以上全部'], ans: 3, exp: '子查询可以出现在 SELECT、FROM、WHERE 以及 HAVING 等子句中，非常灵活。' },
    ]);

    // L1-6: 数据操作语言 (DML) (NEW)
    insertLesson(m1, '数据操作语言 (DML)', dmlContent(), 6, `INSERT INTO sandbox_products (name, category, price, stock)
VALUES ('蓝牙耳机', '电子产品', 399, 120);`, [
      { q: 'DML 指的是哪类语句？', opts: ['数据操作语言', '数据定义语言', '数据控制语言', '数据查询语言'], ans: 0, exp: 'DML 是 Data Manipulation Language（数据操作语言），包括 INSERT、UPDATE、DELETE。' },
      { q: '以下哪个语句用于修改已有数据？', opts: ['INSERT', 'UPDATE', 'ALTER', 'MODIFY'], ans: 1, exp: 'UPDATE 语句用于修改表中已有的数据记录。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 2: 进阶 SQL — 3 lessons / 9 quizzes (NEW)
    // ====================================================================
    const m2 = generateId('mod');
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m2, '进阶 SQL', '深入学习窗口函数、CASE 表达式和 CTE 查询技术', 2, 'intermediate', 60);

    // L2-1: 窗口函数
    insertLesson(m2, '窗口函数基础 (ROW_NUMBER, RANK, DENSE_RANK)', windowFuncContent(), 1, `SELECT name, department, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) as rank
FROM sandbox_employees;`, [
      { q: 'ROW_NUMBER() 遇到并列排名时如何处理？', opts: ['分配相同编号', '按顺序分配不同编号', '跳过下一个编号', '取平均值'], ans: 1, exp: 'ROW_NUMBER() 为每一行分配唯一的连续整数，即使值相同也分配不同编号。' },
      { q: '窗口函数的 OVER 子句中可以包含？', opts: ['仅 PARTITION BY', '仅 ORDER BY', 'PARTITION BY 和 ORDER BY', '不能包含任何子句'], ans: 2, exp: 'OVER 子句中可以包含 PARTITION BY（分区）和 ORDER BY（排序），也可以只用其中之一。' },
      { q: 'RANK() 和 DENSE_RANK() 的核心区别是？', opts: ['RANK 不处理并列', 'DENSE_RANK 会跳过排名数字', 'RANK 在并列后会跳过排名数字，DENSE_RANK 不会', '没有区别'], ans: 2, exp: 'RANK 在并列排名后会跳过（如 1,1,3），而 DENSE_RANK 不会跳过（如 1,1,2）。' },
    ]);

    // L2-2: CASE 表达式
    insertLesson(m2, 'CASE 表达式与条件逻辑', caseContent(), 2, `SELECT name, salary,
  CASE
    WHEN salary >= 20000 THEN '高薪'
    WHEN salary >= 10000 THEN '中薪'
    ELSE '低薪'
  END as level
FROM sandbox_employees;`, [
      { q: 'CASE 表达式有哪两种形式？', opts: ['简单 CASE 和搜索 CASE', 'IF CASE 和 WHEN CASE', 'SELECT CASE 和 WHERE CASE', '单值 CASE 和多值 CASE'], ans: 0, exp: 'CASE 表达式有简单 CASE（CASE 列 WHEN 值）和搜索 CASE（CASE WHEN 条件）两种形式。' },
      { q: '以下 CASE 表达式能替换哪个函数？\nSELECT CASE WHEN score >= 60 THEN \'及格\' ELSE \'不及格\' END', opts: ['SUM()', 'COUNT()', 'IF()', 'COALESCE()'], ans: 2, exp: '搜索 CASE 表达式可以实现类似 IF/ELSE 的复杂条件逻辑。' },
      { q: 'CASE 表达式可以用在哪些地方？', opts: ['仅 SELECT 子句', '仅 ORDER BY 子句', 'SELECT 和 ORDER BY', 'SELECT、ORDER BY、WHERE 等多个子句'], ans: 3, exp: 'CASE 表达式可以用在 SELECT、ORDER BY、WHERE、HAVING 等多个子句中。' },
    ]);

    // L2-3: CTE 与递归查询
    insertLesson(m2, '公共表表达式 (CTE) 与递归查询', cteContent(), 3, `WITH dept_avg AS (
  SELECT department, AVG(salary) as avg_sal
  FROM sandbox_employees
  GROUP BY department
)
SELECT e.name, e.department, e.salary
FROM sandbox_employees e
JOIN dept_avg d ON e.department = d.department
WHERE e.salary > d.avg_sal;`, [
      { q: 'CTE 的主要作用是什么？', opts: ['提高查询速度', '让复杂查询更易读可复用', '创建临时表', '替代视图'], ans: 1, exp: 'CTE（Common Table Expression）让复杂查询更易于阅读和维护，通过 WITH 定义临时结果集。' },
      { q: '递归 CTE 必须包含哪两个部分？', opts: ['SELECT 和 UNION', '锚定成员和递归成员（UNION ALL）', '起始值和终止值', 'INNER JOIN 和 LEFT JOIN'], ans: 1, exp: '递归 CTE 由锚定成员（初始结果集）和递归成员（UNION ALL 连接）两部分组成。' },
      { q: 'CTE 和子查询的主要区别是？', opts: ['CTE 更快', 'CTE 可以多次引用自身定义的临时结果集', '子查询不能嵌套', '没有区别'], ans: 1, exp: 'CTE 允许在同一查询中多次引用同一个临时结果集，提高代码的复用性和可维护性。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 3: 数据库设计 — 5 lessons / 12 quizzes
    // ====================================================================
    const m3 = generateId('mod');
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m3, '数据库设计', '学习如何设计高效、规范的关系数据库', 3, 'intermediate', 75);

    // L3-1: 关系模型基础
    insertLesson(m3, '关系模型基础', relationalModelContent(), 1, null, [
      { q: '关系模型中的"关系"对应数据库中的什么？', opts: ['行', '列', '表', '索引'], ans: 2, exp: '关系模型中的"关系（Relation）"对应数据库中的表。' },
      { q: '以下哪个是实体完整性约束？', opts: ['外键不能为 NULL', '主键不能为 NULL', '列值必须唯一', '所有列都不能为 NULL'], ans: 1, exp: '实体完整性要求主键（Primary Key）不能为 NULL。' },
    ]);

    // L3-2: 三大范式详解
    insertLesson(m3, '三大范式详解', normalizationContent(), 2, null, [
      { q: '第一范式（1NF）要求表中的每一列都是？', opts: ['不可分割的原子值', '主键', '外键', '唯一值'], ans: 0, exp: '1NF 要求每列的值都是不可再分的原子值。' },
      { q: '第三范式解决的是什么依赖问题？', opts: ['部分依赖', '传递依赖', '函数依赖', '多值依赖'], ans: 1, exp: '第三范式（3NF）要求消除非主键列对主键的传递依赖。' },
    ]);

    // L3-3: ER 图设计 (NEW)
    insertLesson(m3, 'ER 图设计', erDiagramContent(), 3, null, [
      { q: 'ER 图中用什么形状表示实体？', opts: ['圆形', '矩形', '菱形', '三角形'], ans: 1, exp: 'ER 图中用矩形（方框）表示实体类型。' },
      { q: 'ER 图中用什么形状表示联系？', opts: ['矩形', '菱形', '椭圆形', '直线'], ans: 1, exp: 'ER 图中用菱形表示实体之间的联系（Relationship）。' },
      { q: '一个学生可以选择多门课程，一门课程有多个学生选，这是什么联系？', opts: ['一对一', '一对多', '多对多', '递归'], ans: 2, exp: '学生和课程之间是多对多关系，需要引入中间表来分解为两个一对多关系。' },
    ]);

    // L3-4: 反范式化策略 (NEW)
    insertLesson(m3, '反范式化策略', denormalizationContent(), 4, null, [
      { q: '反范式化的主要动机是？', opts: ['节省存储空间', '提高写入性能', '提高查询性能', '减少数据冗余'], ans: 2, exp: '反范式化通过有意识地增加冗余来减少 JOIN，从而提升查询性能。' },
      { q: '以下哪个是反范式化的常见做法？', opts: ['拆分大表', '引入冗余字段', '增加更多外键', '压缩数据'], ans: 1, exp: '反范式化常见做法包括引入冗余字段、预计算和派生列等。' },
      { q: '反范式化的一个主要风险是？', opts: ['查询变慢', '数据不一致风险', '索引失效', '无法使用 JOIN'], ans: 1, exp: '数据冗余导致更新时需要维护多个副本，可能产生数据不一致。' },
    ]);

    // L3-5: 数据完整性约束
    insertLesson(m3, '数据完整性约束', integrityContent(), 5, `CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  class_id INTEGER REFERENCES classes(id)
);`, [
      { q: 'NOT NULL 约束属于哪种完整性？', opts: ['实体完整性', '参照完整性', '域完整性', '用户定义完整性'], ans: 2, exp: 'NOT NULL 约束限制列的值不能为空，属于域（Domain）完整性约束。' },
      { q: 'FOREIGN KEY 约束的作用是？', opts: ['保证列值唯一', '保证列值不为空', '保证引用的记录存在（参照完整性）', '自动生成主键值'], ans: 2, exp: '外键约束确保当前表中的值在引用表的主键中存在，维护参照完整性。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 4: 索引与性能优化 — 3 lessons / 8 quizzes
    // ====================================================================
    const m4 = generateId('mod');
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m4, '索引与性能优化', '深入理解数据库索引原理与查询优化技巧', 4, 'advanced', 60);

    // L4-1: 索引原理
    insertLesson(m4, '索引原理', indexContent(), 1, 'EXPLAIN QUERY PLAN SELECT * FROM sandbox_employees WHERE salary > 10000;', [
      { q: 'B+ 树索引中，数据存储在哪个节点？', opts: ['根节点', '内部节点', '叶子节点', '所有节点'], ans: 2, exp: 'B+ 树索引的所有数据都存储在叶子节点，叶子节点之间通过链表连接。' },
      { q: '下面哪种情况不适合建索引？', opts: ['经常作为 WHERE 条件的列', '经常用于 JOIN 的列', '值很少变化的列（如性别）', '大表的排序列'], ans: 2, exp: '值很少变化的列（如性别只有男女）不适合建索引，因为区分度太低。' },
      { q: '聚簇索引（Clustered Index）的特点是？', opts: ['数据和索引分开存储', '数据按照索引顺序物理存储', '一张表可以有多个', '只能建在主键上'], ans: 1, exp: '聚簇索引的数据按照索引顺序物理存储，一张表只能有一个聚簇索引。' },
    ]);

    // L4-2: 查询优化技巧
    insertLesson(m4, '查询优化技巧', optimizationContent(), 2, 'SELECT department, COUNT(*) as emp_count FROM sandbox_employees GROUP BY department ORDER BY emp_count DESC;', [
      { q: '以下哪种做法可能导致无法使用索引？', opts: ['在 WHERE 中使用等值比较', '在 WHERE 中对列使用函数', '在 ORDER BY 中使用索引列', '在 JOIN 中使用索引列'], ans: 1, exp: '在 WHERE 中对列使用函数（如 UPPER(name)）会导致无法使用索引。' },
      { q: 'EXPLAIN 命令的作用是？', opts: ['执行查询', '展示查询执行计划', '优化查询', '创建索引'], ans: 1, exp: 'EXPLAIN 命令展示数据库执行查询的计划，帮助分析和优化查询。' },
    ]);

    // L4-3: 执行计划详解 (NEW)
    insertLesson(m4, '执行计划详解', explainContent(), 3, 'EXPLAIN QUERY PLAN SELECT e.name, d.dept_name FROM employees e JOIN departments d ON e.dept_id = d.id;', [
      { q: '通常执行计划中扫描类型从好到差的排序是？', opts: ['全表扫描 > 索引扫描 > 索引查找', '索引查找 > 索引扫描 > 全表扫描', '三者一样快', '全表扫描最快'], ans: 1, exp: '索引查找（Index Seek）最快，只定位需要的行；索引扫描（Index Scan）次之；全表扫描（Table Scan）最慢。' },
      { q: '执行计划中"回表"是指什么？', opts: ['查询结果返回到客户端', '通过二级索引找到主键后再去主表查数据', '重新执行查询', '表连接操作'], ans: 1, exp: '回表是指通过二级索引找到对应的主键值后，再到聚簇索引中查找完整的数据行。' },
      { q: '在 SQLite 中用哪个命令查看执行计划？', opts: ['SHOW PLAN', 'EXPLAIN QUERY PLAN', 'ANALYZE', 'DESCRIBE'], ans: 1, exp: 'SQLite 中使用 EXPLAIN QUERY PLAN 命令查看查询执行计划。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 5: 事务与并发控制 — 3 lessons / 9 quizzes
    // ====================================================================
    const m5 = generateId('mod');
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m5, '事务与并发控制', '理解事务的 ACID 特性及并发控制机制', 5, 'intermediate', 60);

    // L5-1: 事务的 ACID 特性
    insertLesson(m5, '事务的 ACID 特性', acidContent(), 1, null, [
      { q: 'ACID 中的 "I" 代表什么？', opts: ['Isolation（隔离性）', 'Integrity（完整性）', 'Index（索引）', 'Identity（标识）'], ans: 0, exp: 'I 代表 Isolation（隔离性），确保并发事务互不干扰。' },
      { q: '哪个隔离级别可以防止脏读？', opts: ['READ UNCOMMITTED', 'READ COMMITTED', 'SERIALIZABLE', 'READ COMMITTED 及以上'], ans: 3, exp: 'READ COMMITTED 及以上隔离级别可以防止脏读。' },
      { q: '事务的原子性（Atomicity）要求？', opts: ['事务结果永久保存', '操作要么全成功要么全回滚', '事务互不干扰', '事务前后数据一致'], ans: 1, exp: '原子性要求事务中的所有操作要么全部成功提交，要么全部回滚，不存在中间状态。' },
    ]);

    // L5-2: MVCC 多版本并发控制 (NEW)
    insertLesson(m5, 'MVCC 多版本并发控制', mvccContent(), 2, null, [
      { q: 'MVCC 的核心思想是什么？', opts: ['串行执行所有事务', '保存数据的多个版本让读写不互斥', '使用锁机制', '取消事务隔离'], ans: 1, exp: 'MVCC 通过保存数据的历史版本，让读操作不阻塞写操作、写操作不阻塞读操作。' },
      { q: 'MVCC 主要解决什么问题？', opts: ['死锁问题', '脏写问题', '读写冲突（读不阻塞写、写不阻塞读）', '数据丢失问题'], ans: 2, exp: 'MVCC 的核心价值在于让读操作无需加锁，实现非阻塞读取。' },
      { q: 'MySQL InnoDB 的 REPEATABLE READ 隔离级别下使用的快照是什么？', opts: ['当前读快照', '事务启动时的一致性快照', '最新的数据版本', '磁盘快照'], ans: 1, exp: 'InnoDB 在 REPEATABLE READ 级别下，事务在首次读时创建一致性快照，整个事务期间都读这个快照。' },
    ]);

    // L5-3: 死锁与解决方案 (NEW)
    insertLesson(m5, '死锁与解决方案', deadlockContent(), 3, null, [
      { q: '死锁发生的四个必要条件中，哪个最容易被打破？', opts: ['互斥', '请求与保持', '不剥夺', '循环等待'], ans: 3, exp: '循环等待可以通过统一资源访问顺序来打破，是最常用的死锁避免策略。' },
      { q: '数据库检测到死锁时通常怎么做？', opts: ['重启数据库', '回滚其中一个事务', '等待死锁自动解除', '忽略死锁'], ans: 1, exp: '数据库的死锁检测器会选择代价较小的事务进行回滚来解除死锁。' },
      { q: '避免死锁的常见做法是？', opts: ['减少事务大小', '按相同的顺序访问资源', '使用较低的隔离级别', '以上都是'], ans: 3, exp: '减少事务大小、统一资源访问顺序、使用合适隔离级别等都可以降低死锁概率。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 6: NoSQL 概论 — 1 lesson / 2 quizzes
    // ====================================================================
    const m6 = generateId('mod');
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m6, 'NoSQL 数据库概论', '了解 NoSQL 数据库的类型、适用场景与选型原则', 6, 'beginner', 30);

    insertLesson(m6, 'NoSQL 简介', nosqlContent(), 1, null, [
      { q: 'MongoDB 属于哪种类型的 NoSQL 数据库？', opts: ['键值型', '文档型', '列族型', '图数据库'], ans: 1, exp: 'MongoDB 是最流行的文档型 NoSQL 数据库，使用 JSON 文档存储数据。' },
      { q: 'Redis 最适合用来做什么？', opts: ['持久化存储大量数据', '缓存和会话管理', '复杂关系查询', '全文搜索'], ans: 1, exp: 'Redis 是高性能键值型数据库，最适合缓存、会话管理和计数器等场景。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 7: 数据库安全 — 3 lessons / 9 quizzes (NEW)
    // ====================================================================
    const m7 = generateId('mod');
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m7, '数据库安全', '学习数据库安全防护、权限管理和数据保护策略', 7, 'advanced', 45);

    // L7-1: SQL 注入防御
    insertLesson(m7, 'SQL 注入防御', sqlInjectionContent(), 1, `-- 不安全（易受 SQL 注入）：
SELECT * FROM users WHERE name = '\'' OR 1=1 --';

-- 安全（参数化查询）：
-- db.prepare('SELECT * FROM users WHERE name = ?').get(userInput);`, [
      { q: '最有效的 SQL 注入防御手段是？', opts: ['过滤用户输入', '参数化查询（预编译语句）', '使用 ORM 框架', '关闭错误提示'], ans: 1, exp: '参数化查询将 SQL 逻辑和数据分离，是防御 SQL 注入最有效的手段。' },
      { q: 'SQL 注入的本质原因是？', opts: ['密码太弱', '将用户输入直接拼接到 SQL 语句中', '数据库版本太旧', '没有使用 HTTPS'], ans: 1, exp: 'SQL 注入的根本原因是在构建 SQL 语句时，没有将数据和代码逻辑分离。' },
      { q: '除了参数化查询，以下哪个也是防御 SQL 注入的有效措施？', opts: ['最小权限原则', '加密传输', '增加硬件防火墙', '使用更贵的服务器'], ans: 0, exp: '数据库用户只赋予最小必要权限，即使注入成功也难以造成大规模破坏。' },
    ]);

    // L7-2: 用户权限管理
    insertLesson(m7, '用户权限管理', userPermissionsContent(), 2, `-- 创建用户并授予权限
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE ON db.* TO 'app_user'@'localhost';
REVOKE DROP ON db.* FROM 'app_user'@'localhost';`, [
      { q: '数据库中的 DCL 指什么？', opts: ['数据控制语言（GRANT/REVOKE）', '数据定义语言', '数据操作语言', '数据查询语言'], ans: 0, exp: 'DCL（Data Control Language）包括 GRANT（授权）和 REVOKE（回收权限）语句。' },
      { q: '最小权限原则要求？', opts: ['所有用户拥有相同权限', '用户只拥有完成工作所必需的最小权限', '管理员拥有最小权限', '禁止所有外部访问'], ans: 1, exp: '最小权限原则要求每个用户只拥有完成工作所需的最小权限，减少安全风险。' },
      { q: '以下哪个权限会让用户能够删除表？', opts: ['SELECT', 'INSERT', 'DROP', 'UPDATE'], ans: 2, exp: 'DROP 权限允许用户删除表、索引等数据库对象，是非常敏感的权限。' },
    ]);

    // L7-3: 数据加密与备份策略
    insertLesson(m7, '数据加密与备份策略', encryptionBackupContent(), 3, null, [
      { q: 'TDE（透明数据加密）的主要特点是？', opts: ['应用程序需要修改代码', '应用程序无感知，数据库自动加解密', '只加密索引', '只加密日志文件'], ans: 1, exp: 'TDE 对数据库引擎层面自动进行数据加解密，对应用程序完全透明。' },
      { q: 'RTO 和 RPO 的区别是？', opts: ['RTO 是恢复时间目标，RPO 是恢复点目标', 'RPO 是恢复时间，RTO 是恢复点', '两者相同', 'RTO 决定数据量，RPO 决定速度'], ans: 0, exp: 'RTO（恢复时间目标）衡量恢复需要多长时间，RPO（恢复点目标）衡量最多丢失多少数据。' },
      { q: '最安全的备份策略是？', opts: ['每天全量备份', '3-2-1 备份策略', '只做增量备份', '只备份到本地'], ans: 1, exp: '3-2-1 策略：至少 3 份副本、2 种不同介质、1 份异地存储，是最佳实践的备份策略。' },
    ]);
    // ====================================================================
  });

  tx();

  // Log summary
  const lessonCount = db.prepare('SELECT COUNT(*) as c FROM lessons').get() as { c: number };
  const quizCount = db.prepare('SELECT COUNT(*) as c FROM quizzes').get() as { c: number };
  const modCount = db.prepare('SELECT COUNT(*) as c FROM modules').get() as { c: number };
  console.log(`✅ Database seeded: ${modCount.c} modules, ${lessonCount.c} lessons, ${quizCount.c} quizzes`);
}

// ===== Helper: Insert a lesson with its quizzes =====
function insertLesson(
  moduleId: string,
  title: string,
  content: string,
  orderIndex: number,
  exampleSql: string | null,
  quizzes: { q: string; opts: string[]; ans: number; exp: string }[]
): void {
  const db = getDb();
  const lessonId = generateId('lsn');

  db.prepare(`INSERT INTO lessons (id, module_id, title, content, order_index, example_sql)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run(lessonId, moduleId, title, content, orderIndex, exampleSql);

  quizzes.forEach((quiz, qi) => {
    db.prepare(`INSERT INTO quizzes (id, lesson_id, question, options, correct_answer, explanation, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(generateId('q'), lessonId, quiz.q, JSON.stringify(quiz.opts), quiz.ans, quiz.exp, qi + 1);
  });
}

// ====================================================================
// LESSON CONTENT FUNCTIONS
// ====================================================================

function sqlIntroContent(): string {
  return `## 什么是 SQL？

**SQL**（Structured Query Language，结构化查询语言）是操作关系型数据库的标准语言，几乎所有的关系型数据库（MySQL、PostgreSQL、SQLite、Oracle、SQL Server 等）都支持 SQL。

### 主要功能
- **数据查询** — 用 SELECT 语句从数据库中获取数据
- **数据操作** — 添加、修改、删除数据（INSERT/UPDATE/DELETE）
- **数据定义** — 创建、修改表结构（CREATE/ALTER/DROP）
- **数据控制** — 管理用户权限（GRANT/REVOKE）

### 基本概念
数据库中的数据和表的关系类似 **Excel 工作簿和工作表**：
- 表（Table）= 一张工作表
- 行（Row）= 一条记录
- 列（Column）= 一个字段属性

### SQL 语句分类
| 分类 | 缩写 | 包含语句 | 用途 |
|------|------|----------|------|
| 数据查询 | DQL | SELECT | 检索数据 |
| 数据操纵 | DML | INSERT, UPDATE, DELETE | 修改数据 |
| 数据定义 | DDL | CREATE, ALTER, DROP | 定义结构 |
| 数据控制 | DCL | GRANT, REVOKE | 管理权限 |

### 实例表结构
我们在练习环境中已经准备了以下数据表：

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| sandbox_employees | 员工信息 | id, name, department, salary, hire_date |
| sandbox_products | 商品信息 | id, name, category, price, stock |
| sandbox_customers | 客户信息 | id, name, email, city |
| sandbox_orders | 订单信息 | id, customer_id, product_id, quantity, total |

> 💡 在右侧的 SQL 练习区可以试着手写查询语句。`;
}

function selectBasicsContent(): string {
  return `## SELECT 查询基础

SELECT 是 SQL 中最常用也是最重要的语句，用于从表中检索数据。

### 基本语法
\`\`\`sql
SELECT 列名1, 列名2
FROM 表名
WHERE 条件
ORDER BY 列名 [ASC|DESC]
LIMIT 数量;
\`\`\`

### 常用子句详解

**SELECT** — 指定要查询的列（\`*\` 表示所有列）
\`\`\`sql
SELECT * FROM sandbox_employees;
SELECT name, salary FROM sandbox_employees;
\`\`\`

**WHERE** — 筛选满足条件的行
\`\`\`sql
SELECT * FROM sandbox_employees WHERE salary > 15000;
SELECT * FROM sandbox_products WHERE category = '电子产品' AND price < 500;
\`\`\`

**DISTINCT** — 去重
\`\`\`sql
SELECT DISTINCT department FROM sandbox_employees;
\`\`\`

**ORDER BY** — 排序（ASC 升序/DESC 降序，默认 ASC）
\`\`\`sql
SELECT name, salary FROM sandbox_employees ORDER BY salary DESC;
\`\`\`

**LIMIT + OFFSET** — 分页查询
\`\`\`sql
SELECT * FROM sandbox_products ORDER BY price DESC LIMIT 3 OFFSET 0;
\`\`\`

### 比较运算符
| 运算符 | 说明 | 示例 |
|--------|------|------|
| \`=\` | 等于 | \`salary = 10000\` |
| \`>\`, \`<\` | 大于/小于 | \`salary > 10000\` |
| \`>= \`, \`<=\` | 大于等于/小于等于 | \`salary >= 15000\` |
| \`<>\` | 不等于 | \`department <> '技术部'\` |
| \`LIKE\` | 模糊匹配 | \`name LIKE '张%'\` |
| \`IN\` | 在集合中 | \`department IN ('技术部','市场部')\` |
| \`BETWEEN\` | 范围 | \`salary BETWEEN 10000 AND 20000\` |

> 💡 去试试！在练习区执行 \`SELECT name, salary FROM sandbox_employees WHERE salary > 10000 ORDER BY salary DESC;\``;
}

function aggregateContent(): string {
  return `## 聚合函数与 GROUP BY

聚合函数对一组数据执行计算并返回单个结果，常与 GROUP BY 配合使用。

### 常用聚合函数
| 函数 | 用途 | 示例 |
|------|------|------|
| \`COUNT()\` | 计数 | \`COUNT(*)\` 统计行数 |
| \`SUM()\` | 求和 | \`SUM(salary)\` 工资总和 |
| \`AVG()\` | 平均值 | \`AVG(price)\` 平均价格 |
| \`MAX()\` | 最大值 | \`MAX(salary)\` 最高工资 |
| \`MIN()\` | 最小值 | \`MIN(salary)\` 最低工资 |

### GROUP BY 分组
将数据按某列分组，再对每组应用聚合函数。

\`\`\`sql
-- 每个部门的平均工资
SELECT department, AVG(salary) as avg_salary
FROM sandbox_employees
GROUP BY department;

-- 每个分类的商品数量和平均价格
SELECT category, COUNT(*) as count, ROUND(AVG(price), 2) as avg_price
FROM sandbox_products
GROUP BY category;
\`\`\`

### 列别名
使用 \`AS\` 关键字给列起别名，让结果更易读（AS 可省略）：
\`\`\`sql
SELECT department, MAX(salary) AS max_salary
FROM sandbox_employees
GROUP BY department;
\`\`\`

### HAVING 过滤分组
**WHERE 过滤行，HAVING 过滤分组**。HAVING 在分组聚合之后执行。

\`\`\`sql
-- 平均工资 > 10000 的部门
SELECT department, AVG(salary) as avg_salary
FROM sandbox_employees
GROUP BY department
HAVING AVG(salary) > 12000;
\`\`\`

### 执行顺序
\`\`\`
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
\`\`\`

> 💡 试试：统计每个部门的员工人数和平均工资，按平均工资降序排列。`;
}

function joinContent(): string {
  return `## 多表连接 JOIN

真实业务中数据往往分布在多个表中，JOIN 用于关联查询。

### INNER JOIN（内连接）
只返回两个表中匹配的行。这是最常用的 JOIN 类型。

\`\`\`sql
SELECT e.name, e.department, o.total
FROM sandbox_employees e
INNER JOIN sandbox_orders o ON e.id = o.product_id;
\`\`\`

### LEFT JOIN（左外连接）
返回左表所有行，右表无匹配则填 NULL。

\`\`\`sql
SELECT p.name, o.quantity, o.total
FROM sandbox_products p
LEFT JOIN sandbox_orders o ON p.id = o.product_id;
\`\`\`

### RIGHT JOIN（右外连接）
返回右表所有行，左表无匹配则填 NULL。MySQL 不支持但可用 LEFT JOIN 调换顺序替代。

\`\`\`sql
SELECT p.name, o.quantity
FROM sandbox_orders o
RIGHT JOIN sandbox_products p ON o.product_id = p.id;
\`\`\`

### 多表连接
可以连接两个以上的表。

\`\`\`sql
SELECT c.name AS customer, p.name AS product, o.quantity, o.total
FROM sandbox_orders o
JOIN sandbox_customers c ON o.customer_id = c.id
JOIN sandbox_products p ON o.product_id = p.id;
\`\`\`

### 表别名
用别名简化长表名（AS 可省略）：
\`\`\`sql
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.id;
\`\`\`

### 自连接
同一张表自己连接自己，常用于层级数据（如员工-经理关系）：
\`\`\`sql
SELECT e1.name AS employee, e2.name AS manager
FROM employees e1
LEFT JOIN employees e2 ON e1.manager_id = e2.id;
\`\`\`

> 💡 试试：查询每个客户买了什么产品，包括客户姓名、产品名称和订单总额。`;
}

function subqueryContent(): string {
  return `## 子查询与 EXISTS

子查询（Subquery）是嵌套在另一个查询中的查询，用括号包裹。

### 子查询的三种类型

**1. 标量子查询** — 返回单个值，用在 SELECT 或 WHERE 中
\`\`\`sql
SELECT name, salary,
  (SELECT AVG(salary) FROM sandbox_employees) as avg_salary
FROM sandbox_employees;
\`\`\`

**2. 行子查询** — 返回一行，用在 WHERE 中
\`\`\`sql
SELECT * FROM sandbox_employees
WHERE (department, salary) = (
  SELECT department, salary FROM sandbox_employees WHERE name = '张三'
);
\`\`\`

**3. 表子查询** — 返回多行多列，用在 FROM 中
\`\`\`sql
SELECT dept_stats.department, dept_stats.avg_salary
FROM (
  SELECT department, AVG(salary) as avg_salary
  FROM sandbox_employees
  GROUP BY department
  HAVING AVG(salary) > 12000
) as dept_stats;
\`\`\`

### EXISTS 和 NOT EXISTS
检查子查询是否返回行，常用于关联子查询：

\`\`\`sql
-- 查询有订单记录的客户
SELECT * FROM sandbox_customers c
WHERE EXISTS (
  SELECT 1 FROM sandbox_orders o
  WHERE o.customer_id = c.id
);

-- 查询没有下过单的客户
SELECT * FROM sandbox_customers c
WHERE NOT EXISTS (
  SELECT 1 FROM sandbox_orders o
  WHERE o.customer_id = c.id
);
\`\`\`

### IN 和 NOT IN
检查值是否在子查询结果集中：

\`\`\`sql
-- 查询购买过笔记本电脑的客户
SELECT * FROM sandbox_customers
WHERE id IN (
  SELECT customer_id FROM sandbox_orders
  WHERE product_id = 1
);
\`\`\`

> ⚠️ EXISTS 和 IN 注意：EXISTS 遇到 NULL 仍正常工作，IN 遇到子查询中有 NULL 可能表现异常。通常 EXISTS 性能更好。`;
}

function dmlContent(): string {
  return `## 数据操作语言 (DML)

DML（Data Manipulation Language）包括 INSERT、UPDATE 和 DELETE 语句。

### INSERT — 插入数据
\`\`\`sql
-- 插入单行
INSERT INTO sandbox_products (name, category, price, stock)
VALUES ('蓝牙耳机', '电子产品', 399, 120);

-- 插入多行
INSERT INTO sandbox_products (name, category, price, stock) VALUES
  ('智能手表', '电子产品', 1299, 80),
  ('平板支架', '配件', 69, 300);
\`\`\`

### UPDATE — 更新数据
**一定记得加 WHERE！** 不加 WHERE 会更新所有行。

\`\`\`sql
-- 更新单列
UPDATE sandbox_products SET price = 349 WHERE name = '蓝牙耳机';

-- 更新多列
UPDATE sandbox_products
SET price = price * 0.9, stock = stock + 20
WHERE category = '电子产品' AND stock < 100;
\`\`\`

### DELETE — 删除数据
同样，**一定记得加 WHERE！**

\`\`\`sql
-- 删除特定行
DELETE FROM sandbox_products WHERE name = '台灯';

-- 删除满足条件的所有行
DELETE FROM sandbox_products WHERE stock = 0;
\`\`\`

### TRUNCATE vs DELETE
| 操作 | DELETE | TRUNCATE |
|------|--------|----------|
| 速度 | 慢（逐行删除） | 快（直接释放数据页） |
| WHERE | 支持 | 不支持 |
| 可回滚 | 支持（事务内） | 通常不可回滚 |
| 自增重置 | 不重置 | 重置 |

### 外键约束的影响
如果表之间有外键关联，DELETE 或 UPDATE 可能受到约束限制：
- RESTRICT：默认行为，阻止删除/更新
- CASCADE：同步删除/更新关联记录
- SET NULL：将关联记录的外键设为 NULL

> 💡 在练习区试试：INSERT 一条新产品记录，然后 UPDATE 它的价格。`;
}

function windowFuncContent(): string {
  return `## 窗口函数基础

窗口函数（Window Function）在每一行上执行计算，同时保留详细行的信息，不像 GROUP BY 会折叠行。

### 基本语法
\`\`\`sql
函数名() OVER (
  PARTITION BY 列   -- 可选：按列分区
  ORDER BY 列       -- 可选：排序
) AS 别名
\`\`\`

### 常用的窗口函数

**ROW_NUMBER()** — 为每一行分配唯一的连续编号
\`\`\`sql
SELECT name, department, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num
FROM sandbox_employees;
\`\`\`

**RANK()** — 排名，并列会跳过后续名次
\`\`\`sql
SELECT name, department, salary,
  RANK() OVER (ORDER BY salary DESC) as rank
FROM sandbox_employees;
-- 结果：1,1,3,4,4,6  （跳过 2 和 5）
\`\`\`

**DENSE_RANK()** — 排名，并列不跳过名次
\`\`\`sql
SELECT name, department, salary,
  DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank
FROM sandbox_employees;
-- 结果：1,1,2,3,3,4  （不跳过数字）
\`\`\`

### 分区使用
\`\`\`sql
SELECT name, department, salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
FROM sandbox_employees;
\`\`\`

### 聚合窗口函数
在 OVER 中加 ORDER BY 可以实现累计计算：
\`\`\`sql
SELECT name, department, salary,
  SUM(salary) OVER (ORDER BY salary DESC) as running_total
FROM sandbox_employees;
\`\`\`

> 💡 试试：按部门分区，在每个部门内按工资排序并显示排名。`;
}

function caseContent(): string {
  return `## CASE 表达式与条件逻辑

CASE 表达式在 SQL 中实现 IF-ELSE 条件逻辑。

### 两种语法形式

**1. 简单 CASE 表达式**
比较一个表达式和多个值：
\`\`\`sql
SELECT name, department,
  CASE department
    WHEN '技术部' THEN '技术类'
    WHEN '市场部' THEN '业务类'
    ELSE '支持类'
  END as category
FROM sandbox_employees;
\`\`\`

**2. 搜索 CASE 表达式**
使用布尔条件表达式，更灵活：
\`\`\`sql
SELECT name, salary,
  CASE
    WHEN salary >= 20000 THEN '高薪'
    WHEN salary >= 10000 THEN '中薪'
    ELSE '低薪'
  END as salary_level
FROM sandbox_employees;
\`\`\`

### 在 GROUP BY 中使用 CASE
\`\`\`sql
SELECT
  CASE
    WHEN price < 100 THEN '低价'
    WHEN price < 1000 THEN '中等'
    ELSE '高价'
  END as price_range,
  COUNT(*) as count
FROM sandbox_products
GROUP BY price_range;
\`\`\`

### 在 ORDER BY 中使用 CASE
\`\`\`sql
-- 自定义排序：技术部优先，其他按名称排序
SELECT * FROM sandbox_employees
ORDER BY
  CASE department
    WHEN '技术部' THEN 1
    WHEN '市场部' THEN 2
    ELSE 3
  END,
  name;
\`\`\`

### 使用 CASE 实现数据透视
\`\`\`sql
SELECT department,
  SUM(CASE WHEN salary >= 15000 THEN 1 ELSE 0 END) as high_salary_count,
  SUM(CASE WHEN salary < 15000 THEN 1 ELSE 0 END) as normal_salary_count
FROM sandbox_employees
GROUP BY department;
\`\`\`

> 💡 试试：用 CASE 给产品按价格分档，统计每个档位的产品数量。`;
}

function cteContent(): string {
  return `## 公共表表达式 (CTE) 与递归查询

CTE（Common Table Expression）使用 WITH 子句定义临时结果集，让复杂查询更易读。

### 基本语法
\`\`\`sql
WITH cte_name AS (
  SELECT 查询语句
)
SELECT * FROM cte_name;
\`\`\`

### 为什么用 CTE 而非子查询？
子查询可读性差，CTE 可以多次引用同一个临时结果集：
\`\`\`sql
-- 用 CTE 找高于部门平均工资的员工
WITH dept_avg AS (
  SELECT department, AVG(salary) as avg_sal
  FROM sandbox_employees
  GROUP BY department
)
SELECT e.name, e.department, e.salary
FROM sandbox_employees e
JOIN dept_avg d ON e.department = d.department
WHERE e.salary > d.avg_sal;
\`\`\`

### 多 CTE
可以定义多个 CTE，用逗号分隔：
\`\`\`sql
WITH
expensive AS (
  SELECT * FROM sandbox_products WHERE price > 500
),
recent_orders AS (
  SELECT * FROM sandbox_orders WHERE order_date >= '2024-02-01'
)
SELECT e.name, e.price, r.quantity, r.total
FROM expensive e
JOIN recent_orders r ON e.id = r.product_id;
\`\`\`

### 递归 CTE
递归 CTE 由两部分组成：**锚定成员**（初始值）+ **递归成员**（UNION ALL 自引用）。

\`\`\`sql
WITH RECURSIVE numbers(n) AS (
  SELECT 1            -- 锚定成员：初始值
  UNION ALL
  SELECT n + 1        -- 递归成员：在自身基础上加 1
  FROM numbers
  WHERE n < 10        -- 终止条件
)
SELECT * FROM numbers;
\`\`\`

### 实际应用：组织树
递归 CTE 非常适合查询树形结构的数据（如组织结构、分类层级）：
\`\`\`sql
WITH RECURSIVE org_tree AS (
  -- 顶层节点
  SELECT id, name, manager_id, 0 as level
  FROM employees
  WHERE manager_id IS NULL
  UNION ALL
  -- 递归向下
  SELECT e.id, e.name, e.manager_id, t.level + 1
  FROM employees e
  JOIN org_tree t ON e.manager_id = t.id
)
SELECT * FROM org_tree ORDER BY level, id;
\`\`\`

> 💡 CTE 比子查询更清晰，推荐在复杂查询中使用。`;
}

function relationalModelContent(): string {
  return `## 关系模型基础

关系模型是关系型数据库的理论基础，由 Edgar Codd 于 1970 年提出。

### 核心概念

**关系（Relation）** → 对应数据库中的**表**
**元组（Tuple）** → 对应表中的**行**
**属性（Attribute）** → 对应表中的**列**
**域（Domain）** → 属性值的取值范围

### 键的概念

- **候选键** — 能唯一标识一行的一个或多个属性
- **主键（Primary Key）** — 选定的候选键，每张表只有一个
- **外键（Foreign Key）** — 引用另一张表主键的列，用于建立表间关联
- **复合键** — 由多个列共同组成的主键

### 关系约束

- **实体完整性** — 主键不能为 NULL
- **参照完整性** — 外键必须引用存在的记录
- **域完整性** — 列值必须在定义域内

### 关系操作

- **选择（Selection）** — 筛选行（对应 WHERE）
- **投影（Projection）** — 选列（对应 SELECT 列）
- **连接（Join）** — 合并表
- **除（Division）** — 查询"全部"类型的条件

### 关系代数

关系代数是 SQL 的理论基础，每种 SQL 操作都可以对应到关系代数表达式：

| SQL | 关系代数 |
|-----|----------|
| SELECT | σ (选择) |
| SELECT col | π (投影) |
| JOIN | ⋈ (连接) |
| UNION | ∪ (并) |

> 理解关系模型有助于深刻理解数据库设计的本质。`;
}

function normalizationContent(): string {
  return `## 三大范式详解

范式（Normal Form）是衡量数据库设计规范程度的标准，主要目的是减少数据冗余和避免异常。

### 第一范式（1NF）
**每列都是不可再分的原子值。**

❌ 错误设计：
| 学生ID | 姓名 | 课程 |
|--------|------|------|
| 1 | 张三 | 数学, 英语 |

✅ 正确设计：
| 学生ID | 姓名 | 课程 |
|--------|------|------|
| 1 | 张三 | 数学 |
| 1 | 张三 | 英语 |

### 第二范式（2NF）
**满足 1NF，且每个非主键列完全依赖于主键的全部（消除部分依赖）。**

适用于**复合主键**的情况。假设一个选课表的主键是 \`(学生ID, 课程ID)\`：

❌ 违反 2NF：教师姓名只依赖于课程ID（主键的一部分）
✅ 解：拆分为选课表和课程表

### 第三范式（3NF）
**满足 2NF，且非主键列不传递依赖于主键。**

❌ 违反 3NF：订单表有 \`(订单ID, 客户ID, 客户地址)\`，客户地址通过客户ID传递依赖
✅ 解：拆分为订单表和客户表

### 范式总结
| 范式 | 解决什么问题 | 通俗理解 |
|------|-------------|----------|
| 1NF | 列不可再分 | 不要在一列里塞多个值 |
| 2NF | 部分依赖 | 复合主键时，别让列只依赖其中一部分 |
| 3NF | 传递依赖 | 别让 A→B→C 这种传递关系存在 |

### 实际建议
- 通常设计中达到 **3NF** 就足够了
- 过度范式化会导致查询需要大量 JOIN，性能下降
- 实际工程中常常**反范式化**来换取查询性能`;
}

function erDiagramContent(): string {
  return `## ER 图设计

ER 图（Entity-Relationship Diagram）是数据库设计的可视化工具，帮助理清业务实体之间的关系。

### ER 图符号

| 图形 | 含义 |
|------|------|
| □ 矩形 | 实体（Entity） |
| ◇ 菱形 | 联系（Relationship） |
| ○ 椭圆 | 属性（Attribute） |
| — 线段 | 连接 |
| 下划线属性 | 主键 |

### 联系类型

**1:1（一对一）**
一个人只有一个身份证号，一个身份证号对应一个人。
\`\`\`sql
-- 可以在任意一方加外键
CREATE TABLE person (id INT PRIMARY KEY, name TEXT);
CREATE TABLE id_card (id INT PRIMARY KEY, number TEXT, person_id INT UNIQUE REFERENCES person(id));
\`\`\`

**1:N（一对多）**
一个部门有多个员工，一个员工属于一个部门。
\`\`\`sql
-- 在"多"的一方加外键
CREATE TABLE department (id INT PRIMARY KEY, name TEXT);
CREATE TABLE employee (id INT PRIMARY KEY, name TEXT, dept_id INT REFERENCES department(id));
\`\`\`

**M:N（多对多）**
一个学生选多门课，一门课被多个学生选。
\`\`\`sql
-- 需要引入中间关联表
CREATE TABLE student (id INT PRIMARY KEY, name TEXT);
CREATE TABLE course (id INT PRIMARY KEY, title TEXT);
CREATE TABLE enrollment (
  student_id INT REFERENCES student(id),
  course_id INT REFERENCES course(id),
  PRIMARY KEY (student_id, course_id)
);
\`\`\`

### ER 图设计步骤

1. **识别实体** —— 业务中的核心对象（用户、订单、商品）
2. **确定属性** —— 每个实体的特征
3. **标识关系** —— 实体之间的联系和类型
4. **定义主外键** —— 映射为数据库表结构

### 设计案例：图书管理系统

实体：读者、图书、借阅记录
联系：一个读者可以借多本书（1:N），一本书可以被多个读者借阅（M:N 通过借阅记录）

> ER 图是数据库设计的灵魂，好的设计从画好 ER 图开始。`;
}

function denormalizationContent(): string {
  return `## 反范式化策略

反范式化（Denormalization）是有意引入数据冗余以换取查询性能的设计策略。

### 为什么要反范式化？

范式化的数据库可能需要许多 JOIN 才能获取完整信息，严重影响查询性能。

### 常见反范式化手法

**1. 冗余字段**
把其他表的字段冗余到当前表，减少 JOIN：
\`\`\`sql
-- 范式化：需要 JOIN
SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id;

-- 反范式化：直接在订单表存客户名称
-- orders 表增加 customer_name 列
\`\`\`

**2. 预计算列**
存储计算结果，避免每次查询时计算：
\`\`\`sql
-- 在 order 表增加 total_amount 列
-- 或者在 products 表增加 sales_count 列
\`\`\`

**3. 表合并**
将频繁一起查询的表合并成一张大宽表

### 风险与权衡

| 优点 | 缺点 |
|------|------|
| 查询更快（减少 JOIN） | 数据冗余，占用更多空间 |
| 查询逻辑更简单 | 更新时需维护多个副本 |
| 减少复杂关联 | 可能产生数据不一致 |

### 何时该反范式化？

✅ **适合反范式化的场景：**
- 读多写少的报表系统
- 数据仓库和 OLAP 系统
- 对查询性能有严格要求的应用

❌ **保持范式化的场景：**
- 写入频繁的 OLTP 系统
- 数据一致性要求极高的金融系统
- 存储空间受限的环境

> 关键原则：**先范式化设计，性能不足时再反范式化优化**。`;
}

function integrityContent(): string {
  return `## 数据完整性约束

数据完整性约束保证数据库中数据的正确性和一致性。

### 六大约束类型

**1. PRIMARY KEY（主键约束）**
唯一标识每一行，自动包含 NOT NULL 和 UNIQUE：
\`\`\`sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
\`\`\`

**2. NOT NULL（非空约束）**
确保列不能包含 NULL 值：
\`\`\`sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL
);
\`\`\`

**3. UNIQUE（唯一约束）**
确保列中的值不重复：
\`\`\`sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);
\`\`\`

**4. FOREIGN KEY（外键约束）**
确保引用的记录存在，维护参照完整性：
\`\`\`sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  product_id INTEGER REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);
\`\`\`

**5. CHECK（检查约束）**
确保值满足指定条件：
\`\`\`sql
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT,
  salary REAL CHECK (salary > 0),
  age INTEGER CHECK (age >= 18 AND age <= 65)
);
\`\`\`

**6. DEFAULT（默认值）**
为列指定默认值：
\`\`\`sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  published INTEGER DEFAULT 0
);
\`\`\`

### 外键级联操作
| 选项 | 行为 |
|------|------|
| ON DELETE CASCADE | 父记录删除时，子记录同步删除 |
| ON DELETE SET NULL | 父记录删除时，子记录外键设为 NULL |
| ON DELETE RESTRICT | 不允许删除（默认行为） |
| ON UPDATE CASCADE | 父记录主键更新时，子记录同步更新 |

> 数据完整性是数据库可靠性的基石，设计表时应首先考虑约束。`;
}

function indexContent(): string {
  return `## 索引原理

索引相当于书的目录，帮助数据库快速定位数据，避免全表扫描。

### B+ 树索引
数据库最常用的索引结构，特点：
- 所有数据存储在叶子节点
- 叶子节点构成有序链表，范围查询高效
- 树的高度通常为 3-4 层，数亿数据也能快速定位

### 索引类型

**主键索引（聚簇索引）**
- 数据按主键顺序物理存储
- InnoDB 中主键就是聚簇索引
- 一个表只能有一个聚簇索引

**辅助索引（二级索引）**
- 叶子节点存储主键值，需要回表查询
- 可以创建多个

**唯一索引**
- 确保列值唯一
- 常用于邮箱、身份证号等字段

**复合索引**
- 多列组合的索引
- 最左前缀原则：\`(a, b, c)\` 索引可以加速 \`a\`、\`(a,b)\`、\`(a,b,c)\` 查询

### 索引的代价
- 增删改操作需要同步维护索引，性能下降
- 占用额外的磁盘空间
- 不是越多越好！

### 什么时候该建索引？
✅ 适合建索引：
- WHERE 条件经常使用的列
- JOIN 的连接列
- ORDER BY 的排序列
- 数据量较大的表（万级以上）

❌ 不适合建索引：
- 经常增删改的列
- 值很少变化的列（如性别只有男女）
- 小表（全表扫描更快）
- 区分度低的列`;
}

function optimizationContent(): string {
  return `## 查询优化技巧

### 1. 尽量避免 SELECT *
只查需要的列，减少数据传输和内存占用。

\`\`\`sql
-- 不推荐
SELECT * FROM sandbox_employees;
-- 推荐
SELECT name, salary FROM sandbox_employees;
\`\`\`

### 2. 合理使用 WHERE
过滤条件写精确，让数据库先过滤再处理。

\`\`\`sql
-- 先过滤再排序更高效
SELECT * FROM sandbox_employees
WHERE salary > 10000
ORDER BY salary DESC;
\`\`\`

### 3. 利用索引排序
ORDER BY 的列如果有索引，可以避免文件排序。

\`\`\`sql
-- 如果在 salary 上有索引，这很快
SELECT name, salary FROM sandbox_employees ORDER BY salary DESC;
\`\`\`

### 4. 避免在 WHERE 中对列使用函数
\`\`\`sql
-- 不推荐（无法使用索引）
SELECT * FROM sandbox_employees WHERE UPPER(name) = '张三';
-- 推荐
SELECT * FROM sandbox_employees WHERE name = '张三';
\`\`\`

### 5. 使用 EXPLAIN 分析计划
\`\`\`sql
EXPLAIN QUERY PLAN SELECT * FROM sandbox_employees WHERE salary > 10000;
\`\`\`

### 6. LIMIT 分页
大数据量分页使用 LIMIT + OFFSET，但深度分页效率低。

**优化深度分页：使用游标分页（Keyset Pagination）**
\`\`\`sql
-- 传统分页（越往后越慢）
SELECT * FROM products ORDER BY id LIMIT 10 OFFSET 100000;

-- 游标分页（恒定速度，适合深度翻页）
SELECT * FROM products WHERE id > 100000 ORDER BY id LIMIT 10;
\`\`\`

### 7. 使用聚合代替逐行处理
尽量用数据库的聚合函数，而不是在应用层循环。

### 优化口诀
> 索引要建对， \`SELECT *\` 要回避，
> WHERE 字段不加工，JOIN 太多要警惕，
> EXPLAIN 常查看，慢查询要分析。`;
}

function explainContent(): string {
  return `## 执行计划详解

执行计划（EXPLAIN PLAN）是数据库优化器为查询生成的执行步骤。

### 为什么需要看执行计划？
执行计划告诉你数据库**实际上如何执行你的查询**，而不是你以为它应该怎么执行。

### 在 SQLite 中使用 EXPLAIN
\`\`\`sql
EXPLAIN QUERY PLAN SELECT * FROM sandbox_employees WHERE salary > 10000;
\`\`\`

### 常见扫描类型

| 类型 | 说明 | 性能 |
|------|------|------|
| **Index Seek** | 精确查找，只读取需要的行 | ⭐⭐⭐⭐⭐ |
| **Index Scan** | 扫描索引中的部分范围 | ⭐⭐⭐⭐ |
| **Full Index Scan** | 扫描整个索引 | ⭐⭐⭐ |
| **Table Scan** | 全表扫描，逐行读取 | ⭐ |

### 常见计划分析

**1. 全表扫描（需要优化）**
\`\`\`sql
-- 如果没有索引，会触发全表扫描
EXPLAIN QUERY PLAN SELECT * FROM sandbox_employees WHERE salary > 10000;
-- 结果：SCAN sandbox_employees
\`\`\`

**2. 索引查找（理想情况）**
\`\`\`sql
-- 如果 salary 有索引
CREATE INDEX idx_salary ON sandbox_employees(salary);
EXPLAIN QUERY PLAN SELECT * FROM sandbox_employees WHERE salary = 15000;
-- 结果：SEARCH sandbox_employees USING INDEX idx_salary
\`\`\`

### 如何读懂执行计划

1. **最内层/最缩进的操作最先执行**
2. **关注扫描类型** —— 看到 Table Scan 就要警惕
3. **关注估计行数** —— 和实际差异大说明统计信息过期
4. **JOIN 顺序很重要** —— 小表驱动大表

### 优化路径
- 全表扫描 → 加索引
- 回表太多 → 覆盖索引
- 排序慢 → 索引排序
- JOIN 慢 → 确保关联列有索引

> EXPLAIN 是 SQL 优化的第一步，也是最重要的一步。`;
}

function acidContent(): string {
  return `## 事务的 ACID 特性

### 什么是事务？
事务是一组不可分割的数据库操作，要么全部成功，要么全部失败。

典型场景：转账
\`\`\`sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
  UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
COMMIT;
\`\`\`

### ACID 四大特性

**A - Atomicity（原子性）**
事务中的所有操作要么全部完成，要么全部不执行。如果中间失败，自动回滚到开始前的状态。

**C - Consistency（一致性）**
事务执行前后，数据库都必须满足所有约束（主键唯一、外键引用等）。

**I - Isolation（隔离性）**
并发执行的事务互不干扰。数据库提供了四个隔离级别：
| 级别 | 脏读 | 不可重复读 | 幻读 |
|------|:----:|:----------:|:----:|
| READ UNCOMMITTED | ✅ | ✅ | ✅ |
| READ COMMITTED | ❌ | ✅ | ✅ |
| REPEATABLE READ | ❌ | ❌ | ✅ |
| SERIALIZABLE | ❌ | ❌ | ❌ |

**D - Durability（持久性）**
已提交的事务结果永久保存在数据库中，即使系统崩溃也不会丢失。

### 并发问题
- **脏读** —— 读到另一个事务未提交的数据
- **不可重复读** —— 同一事务内两次读取同一条记录结果不同
- **幻读** —— 同一事务内两次读取同一范围记录数不同

### 如何选择隔离级别？
- 多数业务用 **READ COMMITTED**（避免脏读，性能好）
- 财务场景用 **REPEATABLE READ** 或 **SERIALIZABLE**
- 隔离级别越高，并发越低`;
}

function mvccContent(): string {
  return `## MVCC 多版本并发控制

MVCC（Multi-Version Concurrency Control）是现代数据库实现高并发读取的关键技术。

### 核心思想
**保存数据的多个版本**，让读操作不阻塞写操作，写操作也不阻塞读操作。

### 工作原理解析

每个事务开始时获得一个**事务 ID**，每次修改行时，MySQL 会保存该行的旧版本快照。

**读操作（快照读）：**
- 使用 SELECT 时读取事务启动时的快照
- 不需要加锁，永远不会被阻塞
- 保证读取到的数据是一致的

**写操作（当前读）：**
- UPDATE、DELETE、INSERT 读取最新版本
- 需要加锁防止冲突

### 隐藏列
InnoDB 的每行数据有三个隐藏列：
- **DB_TRX_ID** — 最后修改该行的事务 ID
- **DB_ROLL_PTR** — 指向回滚段中旧版本的指针
- **DB_ROW_ID** — 行 ID（未定义主键时自动生成）

### Undo Log
MVCC 的旧版本数据存储在 Undo Log 中，实现：
- 事务回滚
- 一致性读取（Consistent Read）

### 不同隔离级别下的 MVCC

| 隔离级别 | 快照创建时机 |
|----------|-------------|
| READ COMMITTED | 每次 SELECT 创建新快照 |
| REPEATABLE READ | 第一次 SELECT 创建快照，后续复用 |

### 优缺点

✅ **优点：**
- 读写互不阻塞，极高并发性能
- 使用快照读解决一致性视图问题

❌ **缺点：**
- 旧版本数据占用存储空间
- 长事务可能导致 Undo Log 过大

> MVCC 是现代数据库的标配，理解它是理解数据库并发的钥匙。`;
}

function deadlockContent(): string {
  return `## 死锁与解决方案

死锁（Deadlock）是两个或多个事务互相等待对方释放资源，导致所有事务都无法继续执行。

### 死锁的四个必要条件
1. **互斥** —— 资源一次只能被一个事务使用
2. **请求与保持** —— 持有资源的同时请求其他资源
3. **不剥夺** —— 已获得的资源不能被强制剥夺
4. **循环等待** —— 形成资源等待环路

### 死锁示例

\`\`\`sql
-- 事务 A
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;  -- 锁住 id=1
UPDATE accounts SET balance = balance + 100 WHERE id = 2;  -- 等待 B 释放 id=2

-- 事务 B
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 2;  -- 锁住 id=2
UPDATE accounts SET balance = balance + 100 WHERE id = 1;  -- 等待 A 释放 id=1
\`\`\`

### 数据库如何处理死锁

**死锁检测：**
- 数据库后台有专门的死锁检测器
- 定期检查事务等待图是否存在环路
- 发现死锁后，选择回滚代价最小的事务

**死锁超时：**
- 设置等待超时时间，超过则回滚
- \`innodb_lock_wait_timeout\`（MySQL 默认 50s）

### 如何避免死锁

**1. 统一资源访问顺序**
\`\`\`sql
-- 约定先访问 id 小的记录
-- 事务 A 和 B 都先锁 id=1 再锁 id=2 → 不会死锁
\`\`\`

**2. 缩小事务范围**
尽可能短的事务意味着持有锁的时间短，减少冲突概率。

**3. 使用较低的隔离级别**
低隔离级别使用更少的锁，减少死锁机会。

**4. 使用索引**
无索引的 UPDATE 可能锁住全表，死锁概率大增。

### 死锁 vs 活锁
- **死锁** — 永远等下去，需要外部干预
- **活锁** — 不断重试但始终无法获得资源（较罕见）

> 死锁不可避免但可以降低概率。关键：统一访问顺序、缩短事务时间。`;
}

function nosqlContent(): string {
  return `## NoSQL 数据库概论

### 什么是 NoSQL？
NoSQL = Not Only SQL，是一类非关系型数据库的统称。

### 为什么需要 NoSQL？
- 海量数据需要水平扩展
- 灵活的数据模型
- 高并发读写需求
- 传统关系型数据库的局限性

### NoSQL 四大类型

**1. 文档型（Document）**
- 代表：MongoDB、CouchDB
- 数据格式：JSON 文档
- 适用场景：内容管理、日志、用户画像

**2. 键值型（Key-Value）**
- 代表：Redis、DynamoDB
- 特点：极简模型、超高性能
- 适用场景：缓存、会话管理、计数器

**3. 列族型（Column-Family）**
- 代表：HBase、Cassandra
- 特点：适合海量宽表、高可扩展
- 适用场景：大数据分析、时间序列数据

**4. 图数据库（Graph）**
- 代表：Neo4j、ArangoDB
- 特点：擅长关系查询
- 适用场景：社交网络、推荐系统

### CAP 定理
分布式系统只能保证以下三者中的两个：
- **C（Consistency）** — 一致性
- **A（Availability）** — 可用性
- **P（Partition Tolerance）** — 分区容错性

### 如何选型？
- 数据结构固定、需要复杂查询 → **关系型**
- 数据结构灵活、需要快速原型 → **MongoDB**
- 需要超高性能缓存 → **Redis**
- 海量数据写入 → **Cassandra**
- 强关系查询 → **Neo4j**

> 实践中，大多数应用是**混合使用**关系型 + NoSQL。`;
}

// Module 7 content functions

function sqlInjectionContent(): string {
  return `## SQL 注入防御

SQL 注入是最危险的 Web 安全漏洞之一，攻击者通过在输入中嵌入恶意 SQL 代码来操控数据库。

### SQL 注入原理

当应用程序将用户输入直接拼接到 SQL 语句中时，攻击者可以注入恶意代码：

\`\`\`sql
-- 代码：SELECT * FROM users WHERE name = '用户输入'
-- 用户输入：' OR 1=1 --
-- 实际执行的 SQL（会返回所有用户！）：
SELECT * FROM users WHERE name = '' OR 1=1 --';
\`\`\`

### 注入攻击类型

**1. 布尔盲注** — 通过页面返回真/假来推断数据
**2. 时间盲注** — 通过响应延迟推断数据
**3. 联合查询注入** — 用 UNION 拼接查询
**4. 报错注入** — 通过数据库错误信息获取数据

### 防御措施

**第一道防线：参数化查询（最重要！）**
\`\`\`javascript
// ❌ 不安全：字符串拼接
const sql = \`SELECT * FROM users WHERE name = '\${userInput}'\`;

// ✅ 安全：参数化查询
db.prepare('SELECT * FROM users WHERE name = ?').get(userInput);
\`\`\`

**第二道防线：输入验证与过滤**
- 限制输入长度
- 白名单验证（只允许特定字符）
- 对特殊字符进行转义

**第三道防线：最小权限原则**
- 应用账号只授予 SELECT、INSERT、UPDATE 权限
- 绝不使用 root 或 DBA 账号连接数据库

**第四道防线：Web 应用防火墙（WAF）**
- 检测和拦截恶意请求

> 记住：**永远不要信任用户输入！** 参数化查询是 SQL 注入的最有效防御手段。`;
}

function userPermissionsContent(): string {
  return `## 用户权限管理

数据库权限管理控制用户可以访问哪些资源以及可以进行哪些操作。

### 用户与权限

**创建用户：**
\`\`\`sql
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'secure_password';
\`\`\`

**授予权限（GRANT）：**
\`\`\`sql
-- 授予特定数据库的所有表权限
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'app_user'@'localhost';

-- 授予所有数据库的 SELECT 权限
GRANT SELECT ON *.* TO 'readonly_user'@'%';
\`\`\`

**回收权限（REVOKE）：**
\`\`\`sql
REVOKE DELETE ON mydb.* FROM 'app_user'@'localhost';
REVOKE ALL PRIVILEGES FROM 'app_user'@'localhost';
\`\`\`

### 常见数据库权限

| 权限 | 作用 | 敏感度 |
|------|------|:------:|
| SELECT | 读取数据 | 低 |
| INSERT | 插入数据 | 中 |
| UPDATE | 更新数据 | 中 |
| DELETE | 删除数据 | 高 |
| CREATE | 创建表/数据库 | 高 |
| DROP | 删除表/数据库 | 极高 |
| ALTER | 修改表结构 | 高 |
| GRANT OPTION | 转授权限 | 极高 |

### 最小权限原则

**应该做的事：**
- 为每个应用创建专用数据库用户
- 只授予该用户必需的最小权限
- 定期审计和回收不再需要的权限

**不应该做的事：**
- ❌ 使用 root 账户连接应用
- ❌ 给普通用户授予 DROP 或 ALTER 权限
- ❌ 密码硬编码在代码中

### 角色管理

用角色（Role）简化权限管理：
\`\`\`sql
CREATE ROLE 'read_only', 'read_write';
GRANT SELECT ON mydb.* TO 'read_only';
GRANT SELECT, INSERT, UPDATE ON mydb.* TO 'read_write';
GRANT 'read_only' TO 'report_user'@'localhost';
\`\`\`

> 权限设计原则：给得少比给得多安全，按需最小化。`;
}

function encryptionBackupContent(): string {
  return `## 数据加密与备份策略

### 数据加密

**1. 传输加密（TLS/SSL）**
- 防止数据在传输过程中被窃听
- 配置数据库强制使用 SSL 连接
- 所有现代数据库都支持

**2. 存储加密**
- **TDE（透明数据加密）**：对数据库文件自动加解密，应用无感知
- **列级加密**：对敏感列如身份证号、信用卡号单独加密
- **文件系统加密**：对数据库文件所在磁盘加密

**3. 应用层加密**
- 在应用层对敏感数据加密后再存储
- 即使数据库被攻破，加密数据也无法读取
- 缺点：无法对加密列进行搜索和排序

### 备份策略

**备份类型：**

| 类型 | 说明 | 速度 | 恢复速度 |
|------|------|:----:|:--------:|
| 全量备份 | 完整复制所有数据 | 慢 | 快 |
| 增量备份 | 只备份上次备份后的变化 | 快 | 慢 |
| 差异备份 | 只备份上次全量备份后的变化 | 中 | 中 |

**推荐的 3-2-1 备份策略：**
- **3** — 至少保留 3 份副本
- **2** — 存储在 2 种不同介质上
- **1** — 至少 1 份异地存储

### RTO 和 RPO

- **RTO（Recovery Time Objective）** — 恢复需要多长时间
- **RPO（Recovery Point Objective）** — 最多丢失多少数据

| 场景 | RTO | RPO |
|------|:---:|:---:|
| 银行系统 | < 5分钟 | 秒级 |
| 普通网站 | < 4小时 | 1天 |
| 个人开发 | 1天 | 1周 |

### 备份恢复演练
> 不要等灾难发生才测试备份！定期演练恢复流程是数据安全的最后防线。`;
}

// ====================================================================
// Entry point
// ====================================================================

if (require.main === module) {
  seedDatabase();
  console.log('🎉 Database seeding complete!');
}
