# 贡献指南 / Contributing to GAgent

概述 / Overview
- GAgent 正在将现有 Gemini CLI 演进为更通用的 AI Agent 框架；当前阶段不改代码，优先更新文档与接口草案。
- GAgent aims to evolve the current Gemini CLI into a general AI Agent framework; for now we focus on docs and API drafts without code changes.

可贡献范围 / What to Contribute
- 文档与规范：README、ROADMAP、API 草案、认证与模型配置说明（需中英文双语）。
- Docs & specs: README, ROADMAP, API drafts, auth/model config (bilingual CN/EN).
- Web API 与模型适配设计：路由、响应结构、错误码、Provider/Model 抽象。
- Web API & model adapter design: routes, response shapes, error codes, provider/model abstraction.
- 扩展管理页面信息架构与交互草案。
- Extension management page IA and interaction drafts.
- 测试与示例：面向 Web API 的最小用例与验证。
- Tests & examples: minimal use cases for Web API.

工作区与约束 / Workspaces & Constraints
- 当前工作区：`packages/cli`、`packages/core`、`packages/web-server`。
- Current workspaces: `packages/cli`, `packages/core`, `packages/web-server`.
- 已移除：`a2a-server`、`vscode-ide-companion`，请勿重新引入相关依赖或脚本。
- Removed: `a2a-server`, `vscode-ide-companion`; do not reintroduce related deps or scripts.
- 目标是移除 CLI UI，统一通过 Web API 暴露能力；新特性请面向 `core` 与 `web-server`。
- Goal is to retire CLI UI and expose capabilities via Web API; target `core` and `web-server`.

环境准备 / Setup
- 要求 Node.js `>=20`；安装依赖：`npm install`。
- Node.js `>=20`; install deps: `npm install`.
- 构建：`npm run build`；启动预览：`npm run start --workspace @google/gemini-web-server`。
- Build: `npm run build`; preview: `npm run start --workspace @google/gemini-web-server`.

开发规范 / Standards
- TypeScript + ESM；使用仓库自带 ESLint/Prettier：`npm run lint`、`npm run typecheck`。
- TypeScript + ESM; use ESLint/Prettier: `npm run lint`, `npm run typecheck`.
- 提交前确保构建与（若有）测试通过：`npm run build`、`npm run test --workspaces --if-present`。
- Ensure build and tests (if present) pass before submitting: `npm run build`, `npm run test --workspaces --if-present`.
- 不应提交机密或环境文件；`.env*` 已在 `.gitignore` 中。
- Do not commit secrets or env files; `.env*` is ignored.

提交流程 / How to Submit
- 先创建 Issue，描述问题或提案并关联范围（Web API、认证、模型、扩展、文档）。
- Open an Issue describing the problem/proposal and scope (Web API, auth, model, extensions, docs).
- 创建功能分支，提交小而聚焦的 PR，描述动机与变更点，并链接相关 Issue。
- Create a feature branch, submit small focused PRs with motivation and changes; link the Issue.
- PR 需通过 CI（lint/typecheck/build/test）并符合双语文档要求。
- PRs must pass CI (lint/typecheck/build/test) and meet bilingual docs requirement.

行为准则 / Code of Conduct
- 保持专业、尊重与包容，鼓励透明与协作。
- Be professional, respectful, and inclusive; encourage transparency and collaboration.

许可 / License
- 项目采用 Apache 2.0 许可证；提交即默认同意相关条款。
- Licensed under Apache 2.0; contributions imply agreement to the license.

联系 / Contact
- 通过 Issues 与 PR 进行讨论与协作；欢迎提出改进建议与问题反馈。
- Use Issues and PRs for discussion and collaboration; suggestions and feedback are welcome.
