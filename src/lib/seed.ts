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

  const moduleIds: Record<string, string> = {};

  const tx = db.transaction(() => {
    // ====================================================================
    // MODULE 1: SQL 基础入门 — 6 lessons / 14 quizzes
    // ====================================================================
    const m1 = generateId('mod');
    moduleIds['sql_basics'] = m1;
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m1, 'SQL 基础入门', '从零开始学习 SQL，掌握数据库查询的核心技能', 1, 'beginner', 60);

    insertLesson(m1, '什么是 SQL？', sqlIntroContent(), 1, 'SELECT * FROM sandbox_employees;', [
      { q: 'SQL 的全称是什么？', opts: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'Structured Question Language'], ans: 0, exp: 'SQL 的全称是 Structured Query Language（结构化查询语言）。' },
      { q: '下面哪个不是 SQL 的主要功能？', opts: ['数据查询（SELECT）', '数据定义（CREATE）', '文件压缩', '数据控制（GRANT）'], ans: 2, exp: 'SQL 的主要功能包括数据查询、数据操作、数据定义和数据控制，不涉及文件压缩。' },
    ]);

    insertLesson(m1, 'SELECT 查询基础', selectBasicsContent(), 2, 'SELECT name, salary FROM sandbox_employees WHERE salary > 10000 ORDER BY salary DESC;', [
      { q: '以下哪个子句用于在 SQL 中过滤数据？', opts: ['WHERE', 'HAVING', 'FILTER', 'ORDER BY'], ans: 0, exp: 'WHERE 子句用于在 SQL 查询中过滤行数据。' },
      { q: 'ORDER BY 的默认排序方式是什么？', opts: ['ASC（升序）', 'DESC（降序）', '随机', '不排序'], ans: 0, exp: 'ORDER BY 默认使用 ASC（升序）排序。' },
    ]);

    insertLesson(m1, '聚合函数与 GROUP BY', aggregateContent(), 3, 'SELECT department, AVG(salary) as avg_salary FROM sandbox_employees GROUP BY department;', [
      { q: '计算某列平均值的聚合函数是？', opts: ['AVG()', 'SUM()', 'COUNT()', 'MEAN()'], ans: 0, exp: 'AVG() 函数计算指定列的平均值。' },
      { q: '想要过滤分组后的结果，应该使用哪个子句？', opts: ['WHERE', 'HAVING', 'FILTER', 'GROUP FILTER'], ans: 1, exp: 'HAVING 子句用于过滤 GROUP BY 后的分组结果，WHERE 在分组前过滤。' },
      { q: 'COUNT(*) 统计的是什么？', opts: ['非空值的数量', '表的总行数', '去重后的行数', '数值列的和'], ans: 1, exp: 'COUNT(*) 统计表中的总行数，包括 NULL 值。' },
    ]);

    insertLesson(m1, '多表连接 JOIN', joinContent(), 4, `SELECT c.name, p.name AS product, o.quantity, o.total
FROM sandbox_orders o
JOIN sandbox_customers c ON o.customer_id = c.id
JOIN sandbox_products p ON o.product_id = p.id;`, [
      { q: '哪种 JOIN 只返回两个表中匹配的行？', opts: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], ans: 0, exp: 'INNER JOIN 只返回两个表中满足连接条件的匹配行。' },
      { q: 'LEFT JOIN 中，若右表没有匹配行，右表列的值是什么？', opts: ['0', 'NULL', '空字符串', '抛出错误'], ans: 1, exp: 'LEFT JOIN 在右表没有匹配时，右表的列会填充为 NULL。' },
    ]);

    insertLesson(m1, '子查询与 EXISTS', subqueryContent(), 5, `SELECT name, salary FROM sandbox_employees
WHERE salary > (SELECT AVG(salary) FROM sandbox_employees);`, [
      { q: '以下哪个运算符用于检查子查询是否返回任何行？', opts: ['EXISTS', 'IN', 'ANY', 'ALL'], ans: 0, exp: 'EXISTS 检查子查询是否至少返回一行数据。' },
      { q: '标量子查询返回的结果是？', opts: ['一个表', '单个值', '多行多列', '布尔值'], ans: 1, exp: '标量子查询返回单个值，可以用在 SELECT 列表或 WHERE 比较中。' },
      { q: '子查询可以出现在以下哪个子句中？', opts: ['SELECT', 'FROM', 'WHERE', '以上全部'], ans: 3, exp: '子查询可以出现在 SELECT、FROM、WHERE 以及 HAVING 等子句中，非常灵活。' },
    ]);

    insertLesson(m1, '数据操作语言 (DML)', dmlContent(), 6, `INSERT INTO sandbox_products (name, category, price, stock)
VALUES ('蓝牙耳机', '电子产品', 399, 120);`, [
      { q: 'DML 指的是哪类语句？', opts: ['数据操作语言', '数据定义语言', '数据控制语言', '数据查询语言'], ans: 0, exp: 'DML 是 Data Manipulation Language（数据操作语言），包括 INSERT、UPDATE、DELETE。' },
      { q: '以下哪个语句用于修改已有数据？', opts: ['INSERT', 'UPDATE', 'ALTER', 'MODIFY'], ans: 1, exp: 'UPDATE 语句用于修改表中已有的数据记录。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 2: 进阶 SQL — 3 lessons / 9 quizzes
    // ====================================================================
    const m2 = generateId('mod');
    moduleIds['advanced_sql'] = m2;
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m2, '进阶 SQL', '深入学习窗口函数、CASE 表达式和 CTE 查询技术', 2, 'intermediate', 60);

    insertLesson(m2, '窗口函数基础', windowFuncContent(), 1, `SELECT name, department, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) as rank
FROM sandbox_employees;`, [
      { q: 'ROW_NUMBER() 遇到并列排名时如何处理？', opts: ['分配相同编号', '按顺序分配不同编号', '跳过下一个编号', '取平均值'], ans: 1, exp: 'ROW_NUMBER() 为每一行分配唯一的连续整数，即使值相同也分配不同编号。' },
      { q: '窗口函数的 OVER 子句中可以包含？', opts: ['仅 PARTITION BY', '仅 ORDER BY', 'PARTITION BY 和 ORDER BY', '不能包含任何子句'], ans: 2, exp: 'OVER 子句中可以包含 PARTITION BY（分区）和 ORDER BY（排序）。' },
      { q: 'RANK() 和 DENSE_RANK() 的核心区别是？', opts: ['RANK 不处理并列', 'DENSE_RANK 会跳过排名数字', 'RANK 在并列后会跳过排名数字，DENSE_RANK 不会', '没有区别'], ans: 2, exp: 'RANK 在并列排名后会跳过（如 1,1,3），而 DENSE_RANK 不会跳过（如 1,1,2）。' },
    ]);

    insertLesson(m2, 'CASE 表达式与条件逻辑', caseContent(), 2, `SELECT name, salary,
  CASE
    WHEN salary >= 20000 THEN '高薪'
    WHEN salary >= 10000 THEN '中薪'
    ELSE '低薪'
  END as level
FROM sandbox_employees;`, [
      { q: 'CASE 表达式有哪两种形式？', opts: ['简单 CASE 和搜索 CASE', 'IF CASE 和 WHEN CASE', 'SELECT CASE 和 WHERE CASE', '单值 CASE 和多值 CASE'], ans: 0, exp: 'CASE 表达式有简单 CASE（CASE 列 WHEN 值）和搜索 CASE（CASE WHEN 条件）两种形式。' },
      { q: 'CASE 表达式可以用在哪些地方？', opts: ['仅 SELECT 子句', '仅 ORDER BY 子句', 'SELECT 和 ORDER BY', 'SELECT、ORDER BY、WHERE 等多个子句'], ans: 3, exp: 'CASE 表达式可以用在 SELECT、ORDER BY、WHERE、HAVING 等多个子句中。' },
      { q: '以下 CASE 表达式能替换哪个函数？\nSELECT CASE WHEN score >= 60 THEN \'及格\' ELSE \'不及格\' END', opts: ['SUM()', 'COUNT()', 'IF()', 'COALESCE()'], ans: 2, exp: '搜索 CASE 表达式可以实现类似 IF/ELSE 的复杂条件逻辑。' },
    ]);

    insertLesson(m2, '公共表表达式 (CTE) 与递归查询', cteContent(), 3, `WITH dept_avg AS (
  SELECT department, AVG(salary) as avg_sal
  FROM sandbox_employees
  GROUP BY department
)
SELECT e.name, e.department, e.salary
FROM sandbox_employees e
JOIN dept_avg d ON e.department = d.department
WHERE e.salary > d.avg_sal;`, [
      { q: 'CTE 的主要作用是什么？', opts: ['提高查询速度', '让复杂查询更易读可复用', '创建临时表', '替代视图'], ans: 1, exp: 'CTE（Common Table Expression）让复杂查询更易于阅读和维护。' },
      { q: '递归 CTE 必须包含哪两个部分？', opts: ['SELECT 和 UNION', '锚定成员和递归成员（UNION ALL）', '起始值和终止值', 'INNER JOIN 和 LEFT JOIN'], ans: 1, exp: '递归 CTE 由锚定成员（初始结果集）和递归成员（UNION ALL 连接）两部分组成。' },
      { q: 'CTE 和子查询的主要区别是？', opts: ['CTE 更快', 'CTE 可以多次引用自身定义的临时结果集', '子查询不能嵌套', '没有区别'], ans: 1, exp: 'CTE 允许在同一查询中多次引用同一个临时结果集。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 3: 数据库设计 — 5 lessons / 12 quizzes
    // ====================================================================
    const m3 = generateId('mod');
    moduleIds['db_design'] = m3;
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m3, '数据库设计', '学习如何设计高效、规范的关系数据库', 3, 'intermediate', 75);

    insertLesson(m3, '关系模型基础', relationalModelContent(), 1, null, [
      { q: '关系模型中的"关系"对应数据库中的什么？', opts: ['行', '列', '表', '索引'], ans: 2, exp: '关系模型中的"关系（Relation）"对应数据库中的表。' },
      { q: '以下哪个是实体完整性约束？', opts: ['外键不能为 NULL', '主键不能为 NULL', '列值必须唯一', '所有列都不能为 NULL'], ans: 1, exp: '实体完整性要求主键（Primary Key）不能为 NULL。' },
    ]);

    insertLesson(m3, '三大范式详解', normalizationContent(), 2, null, [
      { q: '第一范式（1NF）要求表中的每一列都是？', opts: ['不可分割的原子值', '主键', '外键', '唯一值'], ans: 0, exp: '1NF 要求每列的值都是不可再分的原子值。' },
      { q: '第三范式解决的是什么依赖问题？', opts: ['部分依赖', '传递依赖', '函数依赖', '多值依赖'], ans: 1, exp: '第三范式（3NF）要求消除非主键列对主键的传递依赖。' },
    ]);

    insertLesson(m3, 'ER 图设计', erDiagramContent(), 3, null, [
      { q: 'ER 图中用什么形状表示实体？', opts: ['圆形', '矩形', '菱形', '三角形'], ans: 1, exp: 'ER 图中用矩形（方框）表示实体类型。' },
      { q: 'ER 图中用什么形状表示联系？', opts: ['矩形', '菱形', '椭圆形', '直线'], ans: 1, exp: 'ER 图中用菱形表示实体之间的联系。' },
      { q: '一个学生可以选择多门课程，一门课程有多个学生选，这是什么联系？', opts: ['一对一', '一对多', '多对多', '递归'], ans: 2, exp: '学生和课程之间是多对多关系。' },
    ]);

    insertLesson(m3, '反范式化策略', denormalizationContent(), 4, null, [
      { q: '反范式化的主要动机是？', opts: ['节省存储空间', '提高写入性能', '提高查询性能', '减少数据冗余'], ans: 2, exp: '反范式化通过有意识地增加冗余来减少 JOIN，从而提升查询性能。' },
      { q: '以下哪个是反范式化的常见做法？', opts: ['拆分大表', '引入冗余字段', '增加更多外键', '压缩数据'], ans: 1, exp: '反范式化常见做法包括引入冗余字段、预计算和派生列等。' },
      { q: '反范式化的一个主要风险是？', opts: ['查询变慢', '数据不一致风险', '索引失效', '无法使用 JOIN'], ans: 1, exp: '数据冗余导致更新时需要维护多个副本，可能产生数据不一致。' },
    ]);

    insertLesson(m3, '数据完整性约束', integrityContent(), 5, `CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  class_id INTEGER REFERENCES classes(id)
);`, [
      { q: 'NOT NULL 约束属于哪种完整性？', opts: ['实体完整性', '参照完整性', '域完整性', '用户定义完整性'], ans: 2, exp: 'NOT NULL 约束限制列的值不能为空，属于域完整性约束。' },
      { q: 'FOREIGN KEY 约束的作用是？', opts: ['保证列值唯一', '保证列值不为空', '保证引用的记录存在', '自动生成主键值'], ans: 2, exp: '外键约束确保当前表中的值在引用表的主键中存在。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 4: 索引与性能优化 — 3 lessons / 8 quizzes
    // ====================================================================
    const m4 = generateId('mod');
    moduleIds['indexing'] = m4;
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m4, '索引与性能优化', '深入理解数据库索引原理与查询优化技巧', 4, 'advanced', 60);

    insertLesson(m4, '索引原理', indexContent(), 1, 'EXPLAIN QUERY PLAN SELECT * FROM sandbox_employees WHERE salary > 10000;', [
      { q: 'B+ 树索引中，数据存储在哪个节点？', opts: ['根节点', '内部节点', '叶子节点', '所有节点'], ans: 2, exp: 'B+ 树索引的所有数据都存储在叶子节点。' },
      { q: '下面哪种情况不适合建索引？', opts: ['经常作为 WHERE 条件的列', '经常用于 JOIN 的列', '值很少变化的列（如性别）', '大表的排序列'], ans: 2, exp: '值很少变化的列不适合建索引，因为区分度太低。' },
      { q: '聚簇索引（Clustered Index）的特点是？', opts: ['数据和索引分开存储', '数据按照索引顺序物理存储', '一张表可以有多个', '只能建在主键上'], ans: 1, exp: '聚簇索引的数据按照索引顺序物理存储，一张表只能有一个。' },
    ]);

    insertLesson(m4, '查询优化技巧', optimizationContent(), 2, 'SELECT department, COUNT(*) as emp_count FROM sandbox_employees GROUP BY department ORDER BY emp_count DESC;', [
      { q: '以下哪种做法可能导致无法使用索引？', opts: ['在 WHERE 中使用等值比较', '在 WHERE 中对列使用函数', '在 ORDER BY 中使用索引列', '在 JOIN 中使用索引列'], ans: 1, exp: '在 WHERE 中对列使用函数会导致无法使用索引。' },
      { q: 'EXPLAIN 命令的作用是？', opts: ['执行查询', '展示查询执行计划', '优化查询', '创建索引'], ans: 1, exp: 'EXPLAIN 命令展示数据库执行查询的计划。' },
    ]);

    insertLesson(m4, '执行计划详解', explainContent(), 3, 'EXPLAIN QUERY PLAN SELECT e.name, d.dept_name FROM employees e JOIN departments d ON e.dept_id = d.id;', [
      { q: '通常执行计划中扫描类型从好到差的排序是？', opts: ['全表扫描 > 索引扫描 > 索引查找', '索引查找 > 索引扫描 > 全表扫描', '三者一样快', '全表扫描最快'], ans: 1, exp: '索引查找最快，索引扫描次之，全表扫描最慢。' },
      { q: '执行计划中"回表"是指什么？', opts: ['查询结果返回到客户端', '通过二级索引找到主键后再去主表查数据', '重新执行查询', '表连接操作'], ans: 1, exp: '回表是指通过二级索引找到对应的主键值后，再到聚簇索引中查找完整的数据行。' },
      { q: '在 SQLite 中用哪个命令查看执行计划？', opts: ['SHOW PLAN', 'EXPLAIN QUERY PLAN', 'ANALYZE', 'DESCRIBE'], ans: 1, exp: 'SQLite 中使用 EXPLAIN QUERY PLAN 命令查看查询执行计划。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 5: 事务与并发控制 — 3 lessons / 9 quizzes
    // ====================================================================
    const m5 = generateId('mod');
    moduleIds['transactions'] = m5;
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m5, '事务与并发控制', '理解事务的 ACID 特性及并发控制机制', 5, 'intermediate', 60);

    insertLesson(m5, '事务的 ACID 特性', acidContent(), 1, null, [
      { q: 'ACID 中的 "I" 代表什么？', opts: ['Isolation（隔离性）', 'Integrity（完整性）', 'Index（索引）', 'Identity（标识）'], ans: 0, exp: 'I 代表 Isolation（隔离性），确保并发事务互不干扰。' },
      { q: '哪个隔离级别可以防止脏读？', opts: ['READ UNCOMMITTED', 'READ COMMITTED', 'SERIALIZABLE', 'READ COMMITTED 及以上'], ans: 3, exp: 'READ COMMITTED 及以上隔离级别可以防止脏读。' },
      { q: '事务的原子性（Atomicity）要求？', opts: ['事务结果永久保存', '操作要么全成功要么全回滚', '事务互不干扰', '事务前后数据一致'], ans: 1, exp: '原子性要求事务中的所有操作要么全部成功提交，要么全部回滚。' },
    ]);

    insertLesson(m5, 'MVCC 多版本并发控制', mvccContent(), 2, null, [
      { q: 'MVCC 的核心思想是什么？', opts: ['串行执行所有事务', '保存数据的多个版本让读写不互斥', '使用锁机制', '取消事务隔离'], ans: 1, exp: 'MVCC 通过保存数据的历史版本，让读操作不阻塞写操作、写操作不阻塞读操作。' },
      { q: 'MVCC 主要解决什么问题？', opts: ['死锁问题', '脏写问题', '读写冲突', '数据丢失问题'], ans: 2, exp: 'MVCC 的核心价值在于让读操作无需加锁，实现非阻塞读取。' },
      { q: 'MySQL InnoDB 的 REPEATABLE READ 隔离级别下使用的快照是什么？', opts: ['当前读快照', '事务启动时的一致性快照', '最新的数据版本', '磁盘快照'], ans: 1, exp: 'InnoDB 在 REPEATABLE READ 级别下，事务在首次读时创建一致性快照。' },
    ]);

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
    moduleIds['nosql'] = m6;
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m6, 'NoSQL 数据库概论', '了解 NoSQL 数据库的类型、适用场景与选型原则', 6, 'beginner', 30);

    insertLesson(m6, 'NoSQL 简介', nosqlContent(), 1, null, [
      { q: 'MongoDB 属于哪种类型的 NoSQL 数据库？', opts: ['键值型', '文档型', '列族型', '图数据库'], ans: 1, exp: 'MongoDB 是最流行的文档型 NoSQL 数据库。' },
      { q: 'Redis 最适合用来做什么？', opts: ['持久化存储大量数据', '缓存和会话管理', '复杂关系查询', '全文搜索'], ans: 1, exp: 'Redis 最适合缓存、会话管理和计数器等场景。' },
    ]);
    // ====================================================================

    // ====================================================================
    // MODULE 7: 数据库安全 — 3 lessons / 9 quizzes
    // ====================================================================
    const m7 = generateId('mod');
    moduleIds['security'] = m7;
    db.prepare(`INSERT INTO modules (id, title, description, order_index, difficulty, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?)`)
      .run(m7, '数据库安全', '学习数据库安全防护、权限管理和数据保护策略', 7, 'advanced', 45);

    insertLesson(m7, 'SQL 注入防御', sqlInjectionContent(), 1, `-- 不安全（易受 SQL 注入）：
SELECT * FROM users WHERE name = '\'' OR 1=1 --';

-- 安全（参数化查询）：
-- db.prepare('SELECT * FROM users WHERE name = ?').get(userInput);`, [
      { q: '最有效的 SQL 注入防御手段是？', opts: ['过滤用户输入', '参数化查询（预编译语句）', '使用 ORM 框架', '关闭错误提示'], ans: 1, exp: '参数化查询将 SQL 逻辑和数据分离，是防御 SQL 注入最有效的手段。' },
      { q: 'SQL 注入的本质原因是？', opts: ['密码太弱', '将用户输入直接拼接到 SQL 语句中', '数据库版本太旧', '没有使用 HTTPS'], ans: 1, exp: 'SQL 注入的根本原因是在构建 SQL 语句时，没有将数据和代码逻辑分离。' },
      { q: '除了参数化查询，以下哪个也是防御 SQL 注入的有效措施？', opts: ['最小权限原则', '加密传输', '增加硬件防火墙', '使用更贵的服务器'], ans: 0, exp: '数据库用户只赋予最小必要权限，即使注入成功也难以造成大规模破坏。' },
    ]);

    insertLesson(m7, '用户权限管理', userPermissionsContent(), 2, `CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE ON db.* TO 'app_user'@'localhost';`, [
      { q: '数据库中的 DCL 指什么？', opts: ['数据控制语言（GRANT/REVOKE）', '数据定义语言', '数据操作语言', '数据查询语言'], ans: 0, exp: 'DCL（Data Control Language）包括 GRANT（授权）和 REVOKE（回收权限）语句。' },
      { q: '最小权限原则要求？', opts: ['所有用户拥有相同权限', '用户只拥有完成工作所必需的最小权限', '管理员拥有最小权限', '禁止所有外部访问'], ans: 1, exp: '最小权限原则要求每个用户只拥有完成工作所需的最小权限。' },
      { q: '以下哪个权限会让用户能够删除表？', opts: ['SELECT', 'INSERT', 'DROP', 'UPDATE'], ans: 2, exp: 'DROP 权限允许用户删除表、索引等数据库对象。' },
    ]);

    insertLesson(m7, '数据加密与备份策略', encryptionBackupContent(), 3, null, [
      { q: 'TDE（透明数据加密）的主要特点是？', opts: ['应用程序需要修改代码', '应用程序无感知，数据库自动加解密', '只加密索引', '只加密日志文件'], ans: 1, exp: 'TDE 对数据库引擎层面自动进行数据加解密，对应用程序完全透明。' },
      { q: 'RTO 和 RPO 的区别是？', opts: ['RTO 是恢复时间目标，RPO 是恢复点目标', 'RPO 是恢复时间，RTO 是恢复点', '两者相同', 'RTO 决定数据量，RPO 决定速度'], ans: 0, exp: 'RTO（恢复时间目标）衡量恢复需要多长时间，RPO（恢复点目标）衡量最多丢失多少数据。' },
      { q: '最安全的备份策略是？', opts: ['每天全量备份', '3-2-1 备份策略', '只做增量备份', '只备份到本地'], ans: 1, exp: '3-2-1 策略是最佳实践的备份策略。' },
    ]);
    // ====================================================================

    // ====================================================================
    // SEED CHALLENGES (12 challenges)
    // ====================================================================
    seedChallenges(db);
    // ====================================================================

    // ====================================================================
    // SEED LEARNING PATHS (3 paths)
    // ====================================================================
    seedLearningPaths(db, moduleIds);
    // ====================================================================
  });

  tx();

  const lessonCount = db.prepare('SELECT COUNT(*) as c FROM lessons').get() as { c: number };
  const quizCount = db.prepare('SELECT COUNT(*) as c FROM quizzes').get() as { c: number };
  const modCount = db.prepare('SELECT COUNT(*) as c FROM modules').get() as { c: number };
  const challengeCount = db.prepare('SELECT COUNT(*) as c FROM challenges').get() as { c: number };
  const pathCount = db.prepare('SELECT COUNT(*) as c FROM learning_paths').get() as { c: number };
  console.log(`✅ Database seeded: ${modCount.c} modules, ${lessonCount.c} lessons, ${quizCount.c} quizzes, ${challengeCount.c} challenges, ${pathCount.c} paths`);
}

function seedChallenges(db: any): void {
  const challenges = [
    {
      id: 'ch_1', title: '查询所有员工',
      description: '编写 SQL 查询，返回 sandbox_employees 表中的所有员工信息。',
      difficulty: 'easy', module_id: null,
      starter_sql: 'SELECT ',
      expected_sql: 'SELECT * FROM sandbox_employees;',
      hint: '使用 SELECT * FROM 表名',
      order_index: 1,
    },
    {
      id: 'ch_2', title: '查询工资大于15000的员工',
      description: '编写 SQL 查询，返回工资（salary）大于 15000 的所有员工姓名和工资。列名：name, salary',
      difficulty: 'easy', module_id: null,
      starter_sql: 'SELECT name, salary ',
      expected_sql: "SELECT name, salary FROM sandbox_employees WHERE salary > 15000;",
      hint: '在 WHERE 子句中使用 salary > 15000',
      order_index: 2,
    },
    {
      id: 'ch_3', title: '统计各部门平均工资',
      description: '编写 SQL 查询，统计每个部门的平均工资。列名：department, avg_salary',
      difficulty: 'easy', module_id: null,
      starter_sql: 'SELECT department, ',
      expected_sql: 'SELECT department, AVG(salary) as avg_salary FROM sandbox_employees GROUP BY department;',
      hint: '使用 GROUP BY 和 AVG() 聚合函数',
      order_index: 3,
    },
    {
      id: 'ch_4', title: '找出从未下单的客户',
      description: '编写 SQL 查询，找出从未下过订单的客户。使用 sandbox_customers 和 sandbox_orders 表。列名：name, email',
      difficulty: 'easy', module_id: null,
      starter_sql: 'SELECT c.name, c.email ',
      expected_sql: 'SELECT c.name, c.email FROM sandbox_customers c WHERE c.id NOT IN (SELECT DISTINCT customer_id FROM sandbox_orders);',
      hint: '使用 NOT IN 或 NOT EXISTS 子查询',
      order_index: 4,
    },
    {
      id: 'ch_5', title: '查询每位客户的总消费金额',
      description: '编写 SQL 查询，计算每位客户的总消费金额。按消费金额降序排列。列名：customer_name, total_spent',
      difficulty: 'medium', module_id: null,
      starter_sql: 'SELECT c.name as customer_name, ',
      expected_sql: 'SELECT c.name as customer_name, SUM(o.total) as total_spent FROM sandbox_customers c JOIN sandbox_orders o ON c.id = o.customer_id GROUP BY c.name ORDER BY total_spent DESC;',
      hint: '使用 JOIN 连接客户表和订单表，SUM() 求和，GROUP BY 分组',
      order_index: 5,
    },
    {
      id: 'ch_6', title: '找出销量最高的商品',
      description: '编写 SQL 查询，找出销量（总销售数量）最高的商品。列名：product_name, total_quantity',
      difficulty: 'medium', module_id: null,
      starter_sql: 'SELECT p.name as product_name, ',
      expected_sql: 'SELECT p.name as product_name, SUM(o.quantity) as total_quantity FROM sandbox_products p JOIN sandbox_orders o ON p.id = o.product_id GROUP BY p.name ORDER BY total_quantity DESC LIMIT 1;',
      hint: '使用 JOIN、SUM()、GROUP BY、ORDER BY 和 LIMIT',
      order_index: 6,
    },
    {
      id: 'ch_7', title: '查询工资高于部门平均的员工',
      description: '编写 SQL 查询，找出工资高于其所在部门平均工资的员工。列名：name, department, salary, avg_salary',
      difficulty: 'medium', module_id: null,
      starter_sql: 'WITH dept_avg AS (',
      expected_sql: 'WITH dept_avg AS (SELECT department, AVG(salary) as avg_sal FROM sandbox_employees GROUP BY department) SELECT e.name, e.department, e.salary, d.avg_sal as avg_salary FROM sandbox_employees e JOIN dept_avg d ON e.department = d.department WHERE e.salary > d.avg_sal;',
      hint: '使用 CTE 先计算各部门平均工资，再与原表 JOIN 比较',
      order_index: 7,
    },
    {
      id: 'ch_8', title: '计算每个分类的库存价值',
      description: '编写 SQL 查询，计算每个商品分类的库存总价值（price * stock）。列名：category, total_value',
      difficulty: 'medium', module_id: null,
      starter_sql: 'SELECT category, ',
      expected_sql: 'SELECT category, SUM(price * stock) as total_value FROM sandbox_products GROUP BY category ORDER BY total_value DESC;',
      hint: '在 SUM() 中使用 price * stock 表达式',
      order_index: 8,
    },
    {
      id: 'ch_9', title: '窗口函数排名',
      description: '编写 SQL 查询，使用窗口函数为每个部门的员工按工资从高到低排名。列名：name, department, salary, dept_rank',
      difficulty: 'medium', module_id: null,
      starter_sql: 'SELECT name, department, salary,',
      expected_sql: "SELECT name, department, salary, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank FROM sandbox_employees;",
      hint: '使用 ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC)',
      order_index: 9,
    },
    {
      id: 'ch_10', title: '查询各部门工资最高的员工',
      description: '编写 SQL 查询，查找每个部门中工资最高的员工。列名：department, name, salary',
      difficulty: 'hard', module_id: null,
      starter_sql: 'WITH ranked AS (',
      expected_sql: "WITH ranked AS (SELECT department, name, salary, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rn FROM sandbox_employees) SELECT department, name, salary FROM ranked WHERE rn = 1;",
      hint: '使用 CTE + 窗口函数 ROW_NUMBER() 然后筛选 rn=1',
      order_index: 10,
    },
    {
      id: 'ch_11', title: '计算各部门薪资差异',
      description: '编写 SQL 查询，统计每个部门最高工资与最低工资的差额。列名：department, salary_range',
      difficulty: 'medium', module_id: null,
      starter_sql: 'SELECT department, ',
      expected_sql: 'SELECT department, MAX(salary) - MIN(salary) as salary_range FROM sandbox_employees GROUP BY department ORDER BY salary_range DESC;',
      hint: '使用 MAX() - MIN() 和 GROUP BY',
      order_index: 11,
    },
    {
      id: 'ch_12', title: '客户购买力排名',
      description: '编写 SQL 查询，计算每位客户的消费总额并排名。使用窗口函数 RANK()。列名：customer_name, total_spent, rank',
      difficulty: 'hard', module_id: null,
      starter_sql: 'WITH customer_spending AS (',
      expected_sql: "WITH customer_spending AS (SELECT c.name as customer_name, SUM(o.total) as total_spent FROM sandbox_customers c JOIN sandbox_orders o ON c.id = o.customer_id GROUP BY c.name) SELECT customer_name, total_spent, RANK() OVER (ORDER BY total_spent DESC) as rank FROM customer_spending;",
      hint: '使用 CTE 先计算消费总额，再在外层用 RANK() 排名',
      order_index: 12,
    },
  ];

  for (const ch of challenges) {
    db.prepare(`INSERT INTO challenges (id, title, description, difficulty, module_id, starter_sql, expected_sql, hint, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(ch.id, ch.title, ch.description, ch.difficulty, ch.module_id, ch.starter_sql, ch.expected_sql, ch.hint, ch.order_index);
  }
}

function seedLearningPaths(db: any, modIds: Record<string, string>): void {
  // Path 1: 数据分析师之路
  const p1 = 'path_1';
  db.prepare(`INSERT INTO learning_paths (id, title, description, target_role, icon, difficulty, estimated_hours, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(p1, '数据分析师之路', '从数据查询到分析思维，掌握数据分析师必备的数据库技能', '数据分析师', '📊', 'beginner', 20, 1);

  // Path 2: 后端开发之路
  const p2 = 'path_2';
  db.prepare(`INSERT INTO learning_paths (id, title, description, target_role, icon, difficulty, estimated_hours, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(p2, '后端开发工程师之路', '全面掌握后端开发所需的数据库设计与查询优化技能', '后端开发工程师', '⚙️', 'intermediate', 35, 2);

  // Path 3: DBA之路
  const p3 = 'path_3';
  db.prepare(`INSERT INTO learning_paths (id, title, description, target_role, icon, difficulty, estimated_hours, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(p3, 'DBA 数据库管理员之路', '深入数据库管理、性能调优与安全管理', 'DBA 数据库管理员', '🗄️', 'advanced', 45, 3);

  // Map modules
  const pathModules = [
    // 数据分析师: SQL基础, 进阶SQL, NoSQL
    { pathId: p1, moduleId: modIds['sql_basics'], order: 1 },
    { pathId: p1, moduleId: modIds['advanced_sql'], order: 2 },
    { pathId: p1, moduleId: modIds['nosql'], order: 3 },
    // 后端开发: SQL基础, 数据库设计, 索引与优化, 安全
    { pathId: p2, moduleId: modIds['sql_basics'], order: 1 },
    { pathId: p2, moduleId: modIds['db_design'], order: 2 },
    { pathId: p2, moduleId: modIds['indexing'], order: 3 },
    { pathId: p2, moduleId: modIds['security'], order: 4 },
    // DBA: SQL基础, 数据库设计, 索引与优化, 事务与并发, 安全
    { pathId: p3, moduleId: modIds['sql_basics'], order: 1 },
    { pathId: p3, moduleId: modIds['db_design'], order: 2 },
    { pathId: p3, moduleId: modIds['indexing'], order: 3 },
    { pathId: p3, moduleId: modIds['transactions'], order: 4 },
    { pathId: p3, moduleId: modIds['security'], order: 5 },
  ];

  for (const pm of pathModules) {
    db.prepare(`INSERT INTO path_modules (id, path_id, module_id, order_index, required) VALUES (?, ?, ?, ?, 1)`)
      .run(crypto.randomUUID(), pm.pathId, pm.moduleId, pm.order);
  }
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
// LESSON CONTENT FUNCTIONS (keep all existing)
// ====================================================================

function sqlIntroContent(): string {
  return `## 什么是 SQL？

**SQL**（Structured Query Language，结构化查询语言）是操作关系型数据库的标准语言。

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

### 实例表结构
我们在练习环境中已经准备了以下数据表：

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| sandbox_employees | 员工信息 | id, name, department, salary, hire_date |
| sandbox_products | 商品信息 | id, name, category, price, stock |
| sandbox_customers | 客户信息 | id, name, email, city |
| sandbox_orders | 订单信息 | id, customer_id, product_id, quantity, total |

> 💡 在练习区可以试着手写查询语句。`;
}

function selectBasicsContent(): string {
  return `## SELECT 查询基础

SELECT 是 SQL 中最常用的语句，用于从表中检索数据。

### 基本语法
\`\`\`sql
SELECT 列名1, 列名2
FROM 表名
WHERE 条件
ORDER BY 列名 [ASC|DESC]
LIMIT 数量;
\`\`\`

### 常用子句详解

**SELECT** — 指定要查询的列
\`\`\`sql
SELECT * FROM sandbox_employees;
SELECT name, salary FROM sandbox_employees;
\`\`\`

**WHERE** — 筛选条件
\`\`\`sql
SELECT * FROM sandbox_employees WHERE salary > 15000;
\`\`\`

**ORDER BY** — 排序
\`\`\`sql
SELECT name, salary FROM sandbox_employees ORDER BY salary DESC;
\`\`\`

**LIMIT** — 限制返回行数
\`\`\`sql
SELECT * FROM sandbox_products ORDER BY price DESC LIMIT 3;
\`\`\`

### 比较运算符
| 运算符 | 说明 |
|--------|------|
| \`=\` | 等于 |
| \`>\`, \`<\` | 大于/小于 |
| \`LIKE\` | 模糊匹配 |
| \`IN\` | 在集合中 |
| \`BETWEEN\` | 范围 |
`;
}

function aggregateContent(): string {
  return `## 聚合函数与 GROUP BY

聚合函数对一组数据执行计算并返回单个结果。

### 常用聚合函数
| 函数 | 用途 |
|------|------|
| COUNT() | 计数 |
| SUM() | 求和 |
| AVG() | 平均值 |
| MAX() | 最大值 |
| MIN() | 最小值 |

### GROUP BY 分组
\`\`\`sql
SELECT department, AVG(salary) as avg_salary
FROM sandbox_employees
GROUP BY department;
\`\`\`

### HAVING 过滤分组
WHERE 过滤行，HAVING 过滤分组。
\`\`\`sql
SELECT department, AVG(salary) as avg_salary
FROM sandbox_employees
GROUP BY department
HAVING AVG(salary) > 12000;
\`\`\`

### 执行顺序
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`;
}

function joinContent(): string {
  return `## 多表连接 JOIN

### INNER JOIN
\`\`\`sql
SELECT e.name, e.department, o.total
FROM sandbox_employees e
INNER JOIN sandbox_orders o ON e.id = o.product_id;
\`\`\`

### LEFT JOIN
\`\`\`sql
SELECT p.name, o.quantity
FROM sandbox_products p
LEFT JOIN sandbox_orders o ON p.id = o.product_id;
\`\`\`

### 多表连接
\`\`\`sql
SELECT c.name AS customer, p.name AS product, o.total
FROM sandbox_orders o
JOIN sandbox_customers c ON o.customer_id = c.id
JOIN sandbox_products p ON o.product_id = p.id;
\`\`\`

### 自连接
\`\`\`sql
SELECT e1.name AS employee, e2.name AS manager
FROM employees e1
LEFT JOIN employees e2 ON e1.manager_id = e2.id;
\`\`\``;
}

function subqueryContent(): string {
  return `## 子查询与 EXISTS

子查询是嵌套在另一个查询中的查询。

### 标量子查询
\`\`\`sql
SELECT name, salary,
  (SELECT AVG(salary) FROM sandbox_employees) as avg_salary
FROM sandbox_employees;
\`\`\`

### EXISTS
\`\`\`sql
SELECT * FROM sandbox_customers c
WHERE EXISTS (
  SELECT 1 FROM sandbox_orders o
  WHERE o.customer_id = c.id
);
\`\`\`

### IN
\`\`\`sql
SELECT * FROM sandbox_customers
WHERE id IN (
  SELECT customer_id FROM sandbox_orders
  WHERE product_id = 1
);
\`\`\``;
}

function dmlContent(): string {
  return `## 数据操作语言 (DML)

### INSERT
\`\`\`sql
INSERT INTO sandbox_products (name, category, price, stock)
VALUES ('蓝牙耳机', '电子产品', 399, 120);
\`\`\`

### UPDATE
一定记得加 WHERE！
\`\`\`sql
UPDATE sandbox_products SET price = 349 WHERE name = '蓝牙耳机';
\`\`\`

### DELETE
\`\`\`sql
DELETE FROM sandbox_products WHERE name = '台灯';
\`\`\``;
}

function windowFuncContent(): string {
  return `## 窗口函数基础

### ROW_NUMBER()
\`\`\`sql
SELECT name, department, salary,
  ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num
FROM sandbox_employees;
\`\`\`

### RANK() 和 DENSE_RANK()
\`\`\`sql
SELECT name, department, salary,
  RANK() OVER (ORDER BY salary DESC) as rank,
  DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank
FROM sandbox_employees;
\`\`\`

### 分区使用
\`\`\`sql
SELECT name, department, salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as dept_rank
FROM sandbox_employees;
\`\`\``;
}

function caseContent(): string {
  return `## CASE 表达式

### 简单 CASE
\`\`\`sql
SELECT name, department,
  CASE department
    WHEN '技术部' THEN '技术类'
    WHEN '市场部' THEN '业务类'
    ELSE '支持类'
  END as category
FROM sandbox_employees;
\`\`\`

### 搜索 CASE
\`\`\`sql
SELECT name, salary,
  CASE
    WHEN salary >= 20000 THEN '高薪'
    WHEN salary >= 10000 THEN '中薪'
    ELSE '低薪'
  END as salary_level
FROM sandbox_employees;
\`\`\``;
}

function cteContent(): string {
  return `## 公共表表达式 (CTE)

### 基本用法
\`\`\`sql
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

### 递归 CTE
\`\`\`sql
WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 10
)
SELECT * FROM numbers;
\`\`\``;
}

function relationalModelContent(): string {
  return `## 关系模型基础

### 核心概念
- **关系** → 表
- **元组** → 行
- **属性** → 列

### 键的概念
- 主键（Primary Key） — 唯一标识一行
- 外键（Foreign Key） — 引用另一张表的主键
- 复合键 — 多个列组成的主键

### 约束
- 实体完整性 — 主键不能为 NULL
- 参照完整性 — 外键必须引用存在的记录`;
}

function normalizationContent(): string {
  return `## 三大范式

| 范式 | 解决什么问题 |
|------|-------------|
| 1NF | 列不可再分 |
| 2NF | 消除部分依赖 |
| 3NF | 消除传递依赖 |

通常设计达到 **3NF** 就足够了。`;
}

function erDiagramContent(): string {
  return `## ER 图设计

### 联系类型
- **1:1** — 一个人一个身份证
- **1:N** — 一个部门多个员工
- **M:N** — 学生选课（需中间表）

M:N 需要引入中间关联表：
\`\`\`sql
CREATE TABLE enrollment (
  student_id INT REFERENCES student(id),
  course_id INT REFERENCES course(id),
  PRIMARY KEY (student_id, course_id)
);
\`\`\``;
}

function denormalizationContent(): string {
  return `## 反范式化策略

有意识地引入数据冗余以换取查询性能。

### 常见手法
1. 冗余字段 — 把其他表的字段冗余到当前表
2. 预计算列 — 存储计算结果
3. 表合并 — 合并频繁一起查询的表

### 何时使用
✅ 读多写少的报表系统
❌ 写入频繁的 OLTP 系统`;
}

function integrityContent(): string {
  return `## 数据完整性约束

### 约束类型
- PRIMARY KEY — 主键
- NOT NULL — 非空
- UNIQUE — 唯一
- FOREIGN KEY — 外键
- CHECK — 检查条件
- DEFAULT — 默认值

### 外键级联
- CASCADE — 同步删除/更新
- SET NULL — 设为 NULL
- RESTRICT — 阻止操作`;
}

function indexContent(): string {
  return `## 索引原理

B+ 树索引特点：
- 所有数据在叶子节点
- 叶子节点有序链表
- 树高通常 3-4 层

### 索引类型
- 主键索引（聚簇索引）— 数据按主键物理存储
- 辅助索引（二级索引）— 叶子存主键值
- 唯一索引 — 确保列值唯一
- 复合索引 — 多列组合，最左前缀原则`;
}

function optimizationContent(): string {
  return `## 查询优化技巧

1. 避免 SELECT *
2. WHERE 中用精确条件
3. 不对列使用函数
4. 用 EXPLAIN 分析计划
5. 深度分页用游标

> EXPLAIN 是 SQL 优化的第一步。`;
}

function explainContent(): string {
  return `## 执行计划详解

| 类型 | 性能 |
|------|:----:|
| Index Seek | ⭐⭐⭐⭐⭐ |
| Index Scan | ⭐⭐⭐⭐ |
| Full Index Scan | ⭐⭐⭐ |
| Table Scan | ⭐ |

看到 Table Scan 就要警惕！`;
}

function acidContent(): string {
  return `## ACID 特性

- **A** 原子性 — 全部成功或全部回滚
- **C** 一致性 — 满足所有约束
- **I** 隔离性 — 四个隔离级别
- **D** 持久性 — 提交后永久保存

### 隔离级别
| 级别 | 脏读 | 不可重复读 | 幻读 |
|------|:----:|:----------:|:----:|
| READ UNCOMMITTED | ✅ | ✅ | ✅ |
| READ COMMITTED | ❌ | ✅ | ✅ |
| REPEATABLE READ | ❌ | ❌ | ✅ |
| SERIALIZABLE | ❌ | ❌ | ❌ |`;
}

function mvccContent(): string {
  return `## MVCC 多版本并发控制

保存数据的多个版本，让读写不互斥。

### 读操作（快照读）
- 读取事务启动时的快照
- 不需要加锁

### 写操作（当前读）
- 读取最新版本
- 需要加锁`;
}

function deadlockContent(): string {
  return `## 死锁与解决方案

### 四个必要条件
1. 互斥
2. 请求与保持
3. 不剥夺
4. 循环等待

### 如何避免
- 统一资源访问顺序
- 缩小事务范围
- 使用合适的隔离级别`;
}

function nosqlContent(): string {
  return `## NoSQL 数据库

### 四大类型
- **文档型** — MongoDB
- **键值型** — Redis
- **列族型** — HBase
- **图数据库** — Neo4j

### CAP 定理
分布式系统只能保证三者中的两个：一致性、可用性、分区容错性。`;
}

function sqlInjectionContent(): string {
  return `## SQL 注入防御

### 原理
攻击者在输入中嵌入恶意 SQL 代码。

### 防御措施
1. **参数化查询** — 最重要
2. 输入验证与过滤
3. 最小权限原则
4. WAF 防火墙

> 永远不要信任用户输入！`;
}

function userPermissionsContent(): string {
  return `## 用户权限管理

### GRANT / REVOKE
\`\`\`sql
GRANT SELECT, INSERT ON mydb.* TO 'user'@'localhost';
REVOKE DELETE ON mydb.* FROM 'user'@'localhost';
\`\`\`

### 最小权限原则
- 为每个应用创建专用用户
- 只授予必需的最小权限
- 绝不使用 root 连接应用`;
}

function encryptionBackupContent(): string {
  return `## 数据加密与备份

### 加密层级
1. 传输加密（TLS/SSL）
2. 存储加密（TDE）
3. 应用层加密

### 3-2-1 备份策略
- **3** 份副本
- **2** 种介质
- **1** 份异地

> 定期演练恢复流程！`;
}

// ====================================================================
// Entry point
// ====================================================================

if (require.main === module) {
  seedDatabase();
  console.log('🎉 Database seeding complete!');
}
