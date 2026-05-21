# DB Academy — 重大迭代变更记录

## 变更概览
本次迭代对 DB Academy 进行了全面升级，从 5 个模块扩展至 7 个模块，新增大量功能和页面。

---

## 1. 数据库 Schema 扩展 (src/lib/db.ts)

### 新增表
- **favorites** — 用户收藏（支持 lesson 和 query 类型）
- **user_settings** — 用户个性化设置（dark_mode、display_name、bio）
- **lesson_comments** — 课程评论
- **sandbox_courses** — 练习用课程表（12 条种子数据）
- **sandbox_enrollments** — 练习用选课成绩表（15 条种子数据）

---

## 2. 课程内容大扩展 (src/lib/seed.ts)

### 模块结构变更

| # | 模块名 | 课时 | 测验题 | 状态 |
|---|--------|:----:|:------:|:----:|
| 1 | SQL 基础入门 | 6 | 14 | 扩展（+3 课 +12 题） |
| 2 | 进阶 SQL | 3 | 9 | 🆕 新建 |
| 3 | 数据库设计 | 5 | 12 | 扩展（+3 课 +10 题） |
| 4 | 索引与性能优化 | 3 | 8 | 扩展（+1 课 +8 题） |
| 5 | 事务与并发控制 | 3 | 9 | 扩展（+2 课 +6 题） |
| 6 | NoSQL 概论 | 1 | 2 | 保持 + 额外测验 |
| 7 | 数据库安全 | 3 | 9 | 🆕 新建 |

**总计：7 模块 · 24 课时 · 63 道测验题** ✅（满足 30+ lessons / 60+ quizzes 要求）

### 新增课程内容
- 子查询与 EXISTS
- 数据操作语言 (DML)
- 窗口函数基础 (ROW_NUMBER, RANK, DENSE_RANK)
- CASE 表达式与条件逻辑
- 公共表表达式 (CTE) 与递归查询
- ER 图设计
- 反范式化策略
- 数据完整性约束
- 执行计划详解
- MVCC 多版本并发控制
- 死锁与解决方案
- SQL 注入防御
- 用户权限管理
- 数据加密与备份策略

### 代码优化
- 新增 `insertLesson()` 辅助函数，减少重复代码

---

## 3. 新增 API 路由

### `/api/settings/route.ts`
- **GET** — 获取用户设置（不存在时自动创建默认值）
- **PATCH** — 更新 display_name、bio、dark_mode
- **POST** — 修改密码（需要 old_password + new_password）

### `/api/search/route.ts`
- **GET /api/search?q=xxx** — 全文搜索课程标题和内容
- 返回匹配结果（含模块名、snippet 片段）
- 搜索结果智能截取匹配文本前后文

### `/api/favorites/route.ts`
- **GET** — 列出用户的所有收藏
- **POST** — 添加收藏（item_type + item_id）
- **DELETE** — 取消收藏（支持按 id 或按 item_type+item_id 删除）

---

## 4. 新增页面

### `/app/settings/page.tsx` — 用户设置
- 修改显示名称和个人简介
- 修改密码（需要原密码验证）
- 深色模式开关（UI 切换器）
- 危险操作区（删除账号按钮，显示暂未开放）

### `/app/search/page.tsx` — 搜索页面
- 顶部搜索输入框
- 实时搜索建议标签（SELECT、JOIN、索引等）
- 结果列表：课程标题 + 模块标签 + 内容片段
- 链接可直接跳转到对应模块

### `/app/certificate/page.tsx` — 结业证书
- 显示学习进度条
- 完成所有课程后展示精美证书
- 证书含：姓名、课程名、完成日期、证书编号
- 底部显示各模块完成进度

---

## 5. UI 改进

### 仪表盘 (`/app/dashboard/page.tsx`)
- 新增「今日查询」「活跃天数」「连续学习」统计卡片
- 新增「最近活动」面板（最后 5 条查询记录）
- 新增「进度领先模块」排行榜
- 布局改为 2/3 主内容 + 1/3 侧栏的双列设计

### SQL 练习场 (`/app/playground/page.tsx`)
- 新增「收藏」按钮，可保存查询到收藏
- **新增收藏侧栏**：查看所有收藏的查询，支持取消收藏
- **新增下载 CSV 按钮**：将查询结果导出为 CSV 文件
- 更好的错误显示（红色背景 + 标题 + 代码样式）
- 新增 sandbox_courses 和 sandbox_enrollments 表结构展示

### 侧栏 (`/components/AppShell.tsx`)
- 顶部新增**搜索栏**，回车跳转到搜索页面
- 用户头像区域新增下拉菜单（设置、退出登录）
- 侧栏新增「证书」导航链接
- 底部显示版本号

---

## 6. 类型定义 (src/types/index.ts)

新增以下 TypeScript 接口：
- `Settings` — 用户设置类型
- `Favorite` — 收藏类型
- `SearchResult` — 搜索结果类型
- `CertificateData` — 证书数据类型
- `Comment` — 课程评论类型

---

## 7. 构建验证

- ✅ `npm run seed` — 成功，7 模块 · 24 课时 · 63 测验题
- ✅ `npx next build` — 成功，0 错误，22 页面全部编译

---

## 文件清单

| 文件 | 操作 |
|------|:----:|
| src/types/index.ts | 重写 |
| src/lib/db.ts | 重写 |
| src/lib/seed.ts | 重写 |
| src/components/AppShell.tsx | 重写 |
| src/app/dashboard/page.tsx | 重写 |
| src/app/playground/page.tsx | 重写 |
| src/app/api/settings/route.ts | 🆕 新建 |
| src/app/api/search/route.ts | 🆕 新建 |
| src/app/api/favorites/route.ts | 🆕 新建 |
| src/app/settings/page.tsx | 🆕 新建 |
| src/app/search/page.tsx | 🆕 新建 |
| src/app/certificate/page.tsx | 🆕 新建 |
