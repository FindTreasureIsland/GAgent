# 项目文档 / Project Docs

目的 / Purpose
- 本目录用于存放 GAgent 项目后续的文档与规范。
- This folder will host future GAgent documentation and specifications.

文档原则 / Principles
- 双语：所有面向贡献者与用户的文档尽量提供中英文版本。
- Bilingual: Provide CN/EN for contributor- and user-facing docs where feasible.
- 一致性：文档与代码实现保持一致，随变更及时更新。
- Consistency: Keep docs in sync with code; update alongside changes.
- 简洁明确：结构清晰、示例充足、术语统一。
- Clarity: Clear structure, sufficient examples, consistent terminology.

建议结构 / Suggested Structure
- `api/`：Web API 规范（路径、参数、响应、错误码）。
- `api/`: Web API specs (routes, params, responses, error codes).
- `auth/`：通用认证方案与配置指引。
- `auth/`: General authentication options and configuration guides.
- `models/`：模型适配层接口与供应商对接说明。
- `models/`: Model adapter interfaces and provider integration notes.
- `extensions/`：扩展管理页面、扩展生命周期与权限模型。
- `extensions/`: Extension management UI, lifecycle, and permission model.
- `guides/`：使用指南与最佳实践。
- `guides/`: Usage guides and best practices.
- `design/`：架构设计与决策记录（ADR）。
- `design/`: Architecture and ADRs.
- `ops/`：部署与运维（不绑定具体容器或平台）。
- `ops/`: Deployment and operations (platform-agnostic).
- `changelog/`：版本发布与变更说明。
- `changelog/`: Releases and change logs.

命名与格式 / Naming & Format
- 文件命名使用短横线（kebab-case），如 `web-api-spec.md`。
- Use kebab-case filenames, e.g., `web-api-spec.md`.
- Markdown 为主（`.md`）；必要时可附加示例 JSON、YAML。
- Prefer Markdown; include example JSON/YAML when appropriate.
- 图片与资源尽量相对路径存放于同级或 `assets/` 子目录。
- Store assets via relative paths in sibling or `assets/`.

贡献流程 / Contribution Flow
- 文档改动需通过 Issue/PR；PR 需简述动机与影响范围。
- Doc changes via Issue/PR; PRs should describe motivation and scope.
- 与代码改动关联提交，保证构建/测试与文档同步更新。
- Link to related code changes; update docs with build/tests.

模板示例 / Template Examples
- API 规范模板：
  - 概述（目的、适用范围）
  - 路径与方法（`POST /v1/...`）
  - 请求参数（query/body/schema）
  - 响应结构（成功/错误示例）
  - 错误码与语义（枚举与说明）
  - 安全/认证（API Key、OAuth2、服务账号）
  - 速率限制与幂等性
  - 版本策略与兼容说明
- API spec template:
  - Overview (purpose, scope)
  - Routes and methods (`POST /v1/...`)
  - Request params (query/body/schema)
  - Response shapes (success/error examples)
  - Error codes and semantics
  - Security/auth (API Key, OAuth2, Service Account)
  - Rate limiting and idempotency
  - Versioning and compatibility

维护与演进 / Maintenance
- 文档与 `README.md`、`ROADMAP.md`、`CONTRIBUTING.md` 保持一致。
- Keep aligned with `README.md`, `ROADMAP.md`, and `CONTRIBUTING.md`.
- 定期审阅与归档过期内容，标注弃用与迁移路径。
- Review regularly; mark deprecations and migration paths.