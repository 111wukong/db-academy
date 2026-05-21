import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'db-academy.sqlite');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initSchema(db);
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('beginner','intermediate','advanced')) DEFAULT 'beginner',
      estimated_minutes INTEGER DEFAULT 30,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      example_sql TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      explanation TEXT,
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      completed INTEGER DEFAULT 0,
      quiz_score REAL,
      completed_at TEXT,
      UNIQUE(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT CHECK(role IN ('user','assistant')) NOT NULL,
      content TEXT NOT NULL,
      module_context TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS query_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      query TEXT NOT NULL,
      result TEXT,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Favorites
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_type TEXT CHECK(item_type IN ('lesson','query')) NOT NULL,
      item_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, item_type, item_id)
    );

    -- User settings
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      dark_mode INTEGER DEFAULT 0,
      display_name TEXT,
      bio TEXT DEFAULT ''
    );

    -- Lesson comments
    CREATE TABLE IF NOT EXISTS lesson_comments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Sandbox tables for SQL playground
    CREATE TABLE IF NOT EXISTS sandbox_employees (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT,
      salary REAL,
      hire_date TEXT
    );

    CREATE TABLE IF NOT EXISTS sandbox_products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      price REAL,
      stock INTEGER
    );

    CREATE TABLE IF NOT EXISTS sandbox_orders (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      order_date TEXT,
      total REAL
    );

    CREATE TABLE IF NOT EXISTS sandbox_customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      city TEXT,
      signup_date TEXT
    );

    -- New sandbox tables
    CREATE TABLE IF NOT EXISTS sandbox_courses (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      teacher TEXT,
      credits INTEGER,
      department TEXT
    );

    CREATE TABLE IF NOT EXISTS sandbox_enrollments (
      id INTEGER PRIMARY KEY,
      student_id INTEGER,
      course_id INTEGER,
      grade REAL,
      semester TEXT
    );
  `);
}

// Sandbox data seeding (only if empty)
export function seedSandboxData(): void {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM sandbox_employees').get() as { c: number };
  if (count.c > 0) return;

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO sandbox_employees (id, name, department, salary, hire_date) VALUES
      (1, '张三', '技术部', 15000, '2022-03-15'),
      (2, '李四', '市场部', 12000, '2023-01-10'),
      (3, '王五', '技术部', 18000, '2021-06-01'),
      (4, '赵六', '人事部', 10000, '2023-09-20'),
      (5, '孙七', '技术部', 22000, '2020-02-28'),
      (6, '周八', '市场部', 11000, '2024-01-15'),
      (7, '吴九', '财务部', 13000, '2022-11-01'),
      (8, '郑十', '技术部', 25000, '2019-07-15')
    `).run();

    db.prepare(`
      INSERT INTO sandbox_products (id, name, category, price, stock) VALUES
      (1, '笔记本电脑', '电子产品', 5999, 50),
      (2, '无线鼠标', '电子产品', 89, 200),
      (3, '机械键盘', '电子产品', 299, 150),
      (4, '显示器 27寸', '电子产品', 1999, 30),
      (5, '办公椅', '家具', 899, 20),
      (6, '台灯', '家具', 159, 100),
      (7, 'USB-C 扩展坞', '配件', 399, 80),
      (8, '移动硬盘 2TB', '配件', 499, 60)
    `).run();

    db.prepare(`
      INSERT INTO sandbox_customers (id, name, email, city, signup_date) VALUES
      (1, '刘先生', 'liu@example.com', '北京', '2023-01-01'),
      (2, '陈女士', 'chen@example.com', '上海', '2023-02-15'),
      (3, '杨先生', 'yang@example.com', '深圳', '2023-03-20'),
      (4, '黄女士', 'huang@example.com', '成都', '2023-04-10'),
      (5, '林先生', 'lin@example.com', '杭州', '2023-05-05')
    `).run();

    db.prepare(`
      INSERT INTO sandbox_orders (id, customer_id, product_id, quantity, order_date, total) VALUES
      (1, 1, 1, 1, '2024-01-10', 5999),
      (2, 1, 2, 2, '2024-01-10', 178),
      (3, 2, 3, 1, '2024-01-15', 299),
      (4, 3, 1, 1, '2024-02-01', 5999),
      (5, 3, 4, 2, '2024-02-01', 3998),
      (6, 4, 5, 1, '2024-02-20', 899),
      (7, 5, 1, 1, '2024-03-05', 5999),
      (8, 5, 7, 1, '2024-03-05', 399),
      (9, 2, 8, 1, '2024-03-10', 499),
      (10, 4, 6, 3, '2024-03-15', 477)
    `).run();

    // Seed new sandbox tables
    db.prepare(`
      INSERT INTO sandbox_courses (id, name, teacher, credits, department) VALUES
      (1, '数据库原理', '陈教授', 4, '计算机科学'),
      (2, '数据结构', '王教授', 4, '计算机科学'),
      (3, '操作系统', '李教授', 3, '计算机科学'),
      (4, '计算机网络', '张教授', 3, '计算机科学'),
      (5, '软件工程', '赵教授', 3, '软件工程'),
      (6, '人工智能导论', '刘教授', 3, '人工智能'),
      (7, '数据挖掘', '杨教授', 3, '人工智能'),
      (8, '编译原理', '周教授', 4, '计算机科学'),
      (9, '线性代数', '吴教授', 4, '数学'),
      (10, '概率论与数理统计', '郑教授', 4, '数学'),
      (11, 'Java 程序设计', '孙教授', 3, '软件工程'),
      (12, 'Web 开发技术', '钱教授', 3, '软件工程')
    `).run();

    db.prepare(`
      INSERT INTO sandbox_enrollments (id, student_id, course_id, grade, semester) VALUES
      (1, 1, 1, 92.5, '2024-秋'),
      (2, 1, 3, 85.0, '2024-秋'),
      (3, 1, 5, 78.5, '2024-秋'),
      (4, 2, 1, 88.0, '2024-秋'),
      (5, 2, 2, 91.0, '2024-秋'),
      (6, 3, 1, 95.0, '2024-秋'),
      (7, 3, 4, 82.5, '2024-秋'),
      (8, 3, 6, 90.0, '2024-秋'),
      (9, 4, 2, 76.0, '2024-秋'),
      (10, 4, 7, 88.5, '2024-秋'),
      (11, 5, 1, 83.0, '2024-秋'),
      (12, 5, 3, 79.5, '2024-秋'),
      (13, 5, 8, 91.5, '2024-秋'),
      (14, 1, 2, 87.0, '2024-春'),
      (15, 2, 4, 93.0, '2024-春')
    `).run();
  });

  tx();
  console.log('✅ Sandbox data seeded (including courses and enrollments)');
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
