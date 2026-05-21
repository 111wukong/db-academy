# DB Academy

> 面向大学生的数据库在线学习平台。AI 辅导 + SQL 练习 + 系统化课程。

## 🚀 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库（创建表结构 + 种子数据）
npm run seed

# 3. 启动开发服务器
npm run dev
```

访问 **http://localhost:3000** 即可使用。

## 🏗️ 系统架构

```
┌─────────────────────────────────────┐
│           Next.js App (App Router)   │
│  ┌────────────┐  ┌────────────────┐  │
│  │   Frontend  │  │   API Routes    │  │
│  │  (React +   │  │  /api/auth/*    │  │
│  │   Tailwind) │  │  /api/modules   │  │
│  │             │  │  /api/chat      │  │
│  │   Pages:    │  │  /api/query     │  │
│  │   /dashboard│  │  /api/progress  │  │
│  │   /learn/*  │  │  /api/quiz      │  │
│  │   /playground│ └────────────────┘  │
│  │   /chat     │         │            │
│  │   /quiz/*   │         ▼            │
│  └────────────┘  ┌────────────────┐  │
│                  │   DeepSeek AI   │  │
│                  │   (Chat API)    │  │
│                  └────────────────┘  │
└─────────────────────┬───────────────┘
                      │
              ┌───────┴───────┐
              │   SQLite DB   │
              │   (better-    │
              │   sqlite3)    │
              └───────────────┘
```

## 📁 文件结构

```
db-academy/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.local                 # API Key + 配置
├── data/                      # SQLite 数据库文件（自动创建）
├── src/
│   ├── app/
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页（Landing Page）
│   │   ├── login/page.tsx     # 登录/注册
│   │   ├── dashboard/page.tsx # 学习概览
│   │   ├── learn/
│   │   │   ├── page.tsx       # 课程列表
│   │   │   └── [moduleId]/page.tsx  # 课程详情
│   │   ├── playground/page.tsx      # SQL 练习场
│   │   ├── chat/page.tsx            # AI 辅导
│   │   ├── quiz/[lessonId]/page.tsx # 测验
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   └── login/route.ts
│   │       ├── modules/route.ts
│   │       ├── chat/route.ts
│   │       ├── query/route.ts
│   │       ├── progress/route.ts
│   │       └── quiz/route.ts
│   ├── components/
│   │   └── AppShell.tsx             # 侧边栏 + 布局壳
│   ├── lib/
│   │   ├── db.ts                    # 数据库初始化
│   │   ├── auth.ts                  # 用户认证
│   │   ├── auth-context.tsx         # 前端认证上下文
│   │   ├── deepseek.ts              # DeepSeek API 集成
│   │   ├── sandbox.ts               # SQL 沙箱执行器
│   │   ├── seed.ts                  # 种子数据 & 课程内容
│   │   └── middleware.ts            # API 中间件
│   └── types/
│       └── index.ts                 # TypeScript 类型
```

## 🗄️ 数据库模式

| 表名 | 说明 |
|------|------|
| `users` | 用户（邮箱 + 密码哈希 + JWT） |
| `modules` | 学习模块（标题/描述/难度/时长） |
| `lessons` | 课程（Markdown 内容 + 示例 SQL） |
| `quizzes` | 测验题目（选择题 + 解析） |
| `user_progress` | 学习进度（已完成课程/分数） |
| `chat_history` | AI 对话历史 |
| `query_history` | SQL 查询历史 |
| `sandbox_*` (4 表) | 练习用数据表（员工/商品/客户/订单） |

## 🔌 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/modules` | GET | 获取课程列表（支持 ?moduleId= 过滤） |
| `/api/progress` | GET | 获取学习进度 |
| `/api/progress` | POST | 更新学习进度 |
| `/api/chat` | POST | AI 对话（DeepSeek API） |
| `/api/query` | POST | 执行 SQL 查询（沙箱安全） |
| `/api/quiz` | GET | 获取测验题目（?lessonId=） |
| `/api/quiz` | POST | 提交测验答案 |

## 🎨 UI 架构

```
pages/
├── /                    Landing Page（未登录）
├── /login              登录/注册
├── /dashboard          学习概览（进度、统计）
├── /learn              全部课程列表
├── /learn/[moduleId]   课程详情 + 课时 + Markdown 渲染
├── /playground         SQL 编辑器 + 结果展示
├── /chat               AI 对话界面
└── /quiz/[lessonId]    测验交互

components/
├── AppShell             侧边栏导航 + 用户信息
├── (pages 内联)         ChatInterface, SQLEditor, QuizQuestion 等
```

## 🧪 预置数据

### 学习模块（5 个）
1. **SQL 基础入门** — SELECT、WHERE、JOIN、GROUP BY（4 课 + 4 测验）
2. **数据库设计与范式** — 关系模型、三大范式（2 课 + 1 测验）
3. **索引与性能优化** — B+树索引、查询优化技巧（2 课）
4. **事务与并发控制** — ACID、隔离级别（1 课 + 1 测验）
5. **NoSQL 数据库概论** — 文档/键值/列族/图（1 课）

### SQL 练习数据（4 张演示表）
- `sandbox_employees` — 8 条员工记录
- `sandbox_products` — 8 条商品记录
- `sandbox_customers` — 5 条客户记录
- `sandbox_orders` — 10 条订单记录

## 🔧 配置

在 `.env.local` 中配置：

```env
DEEPSEEK_API_KEY=sk-your-key-here
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
JWT_SECRET=your-secret-key
```

## 📝 技术栈

- **框架**: Next.js 14 (App Router)
- **前端**: React 18 + TypeScript + Tailwind CSS
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (jsonwebtoken) + bcryptjs
- **AI**: DeepSeek Chat API
- **内容**: Markdown (react-markdown + remark-gfm)
