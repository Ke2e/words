# words

基于 SDD（Spec-Driven Development，规格驱动开发）工作流构建的英语单词学习平台，为不同端的单词学习产品提供统一的数据底座。

当前包含的子项目：

| 子项目 | 说明 | 技术栈 |
| --- | --- | --- |
| [words-admin](./words-admin) | 管理后台：管理员权限、单词书与词库数据管理 | Next.js 16 · Drizzle ORM · Supabase |
| [words-h5](./words-h5) | H5 学习端：卡片式背单词、进度同步（与 words-admin 共库） | Next.js 14 · NextAuth v5 · Supabase |

## words-admin 核心功能

- **管理员认证与会话**：bcrypt 密码哈希，服务端 Session（httpOnly Cookie，7 天有效期），登录时自动清理过期会话
- **两级角色权限**：`system_admin`（系统管理员）/ `admin`（普通管理员），管理员管理类接口统一走 `requireSystemAdmin` 守卫
- **账号管控**：管理员可被启用/禁用，禁用立即生效（会话校验时直接拦截）
- **首个管理员引导**：数据库无管理员时，首页自动引导注册首个系统管理员，避免裸部署无入口
- **单词书管理**：创建、编辑、删除、搜索，`bookId` 唯一性校验
- **词库数据**：单词明细以 JSON 结构存储（音标、释义、例句、短语等），按词书关联
- **数据清洗**：Node.js 脚本将开源词库 JSONL 转为 CSV，批量导入 PostgreSQL

## 技术选型

| 层次 | 方案 | 说明 |
| --- | --- | --- |
| 框架 | Next.js 16 (App Router) + React 19 | Route Handlers 承载 API，Server 端统一鉴权 |
| 语言 | TypeScript (strict) | 全链路类型安全 |
| ORM | Drizzle ORM + postgres-js | Schema 即代码，drizzle-kit 管理迁移 |
| 数据库 | PostgreSQL（Supabase） | 云端 BaaS，免运维 |
| UI | Tailwind CSS v4 + shadcn/ui | 按需引入组件，源码可控 |
| 鉴权 | bcryptjs + 自研 Session | 无第三方 auth 依赖，逻辑透明 |

## 开发方式：SDD + Codex

项目采用 **规格驱动开发（SDD）+ OpenAI Codex** 的 AI 结对方式构建，按 **需求（proposal）→ 技术设计（design）→ 任务拆解 → 按任务边界执行 + 人工验收** 的流程推进：

1. 先写规格文档，明确需求边界与验收标准
2. Codex 按单个任务执行实现，不越界扩展范围；人负责需求澄清、方案审批与逐任务验收
3. 每个任务完成后对照验收标准自检，人工确认后进入下一任务

这种"规格先行 + 小步验收"的方式保证了代码与需求的一致性，也让人工审查始终聚焦在关键决策上。各子项目的 SDD 文档：

- [words-h5 需求文档](./words-h5/docs/proposal.md)、[技术设计文档](./words-h5/docs/design.md)（含任务拆分与验收标准）

## 快速开始

- 管理后台（words-admin）：见 [words-admin/README.md](./words-admin/README.md)
- H5 学习端（words-h5）：见 [words-h5/README.md](./words-h5/README.md)
