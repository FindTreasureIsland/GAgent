# GAgent / GAgent

概述 / Overview
- GAgent 致力于将现有 Gemini CLI 演进为更通用的智能体（AI Agent）框架；当前阶段不修改代码，先行以文档明确目标与方向。
- GAgent aims to evolve the current Gemini CLI into a more general AI Agent framework; at this stage we do not modify code and focus on documentation to clarify goals and direction.

项目目标 / Goals
- 去掉 CLI 交互界面，统一以 Web API 提供能力。
- Provide capabilities via Web API instead of a CLI UI.
- 提供更通用、可扩展的认证方式（API Key、OAuth2、服务账号等）。
- Offer generalized, extensible authentication (API Key, OAuth2, Service Account).
- 以 Web API 对外提供 AI Agent 服务（支持同步与流式输出）。
- Expose AI Agent services over Web API (sync and streaming).
- 支持可配置的后端模型（对接不同模型供应商与模型 ID）。
- Support configurable backend models (multiple providers and model IDs).
- 提供 Agent 扩展管理页面（安装、启用、禁用、配置）。
- Provide an Agent extension management page (install, enable/disable, configure).

核心特性（规划） / Planned Features
- Web API：统一的 HTTP 接口用于调用智能体能力。
- Web API: Unified HTTP interfaces to invoke agent capabilities.
- 认证抽象：支持多种认证策略与凭据来源。
- Auth abstraction: multiple credential strategies and sources.
- 模型适配层：将不同模型供应商抽象为统一调用接口。
- Model adapters: unified interface across providers.
- 扩展管理：可视化页面管理 Agent 扩展与配置。
- Extension management: UI to manage extensions and settings.
- 配置管理：通过环境变量或配置文件统一管理。
- Configuration: environment variables and config files.

Web API 形态（草案） / Web API (Draft)
- `POST /v1/agents/:agentId/invoke`：请求智能体执行任务，返回结果。
- `POST /v1/agents/:agentId/invoke`: invoke agent task, return result.
- `POST /v1/agents/:agentId/stream`：以 SSE/流式方式返回生成内容。
- `POST /v1/agents/:agentId/stream`: stream responses via SSE.
- `GET /v1/extensions`：列出已安装/可用的扩展。
- `GET /v1/extensions`: list installed/available extensions.
- `POST /v1/extensions/install`：安装扩展。
- `POST /v1/extensions/install`: install an extension.
- `PUT /v1/config/model`：设置/更新当前使用的后端模型。
- `PUT /v1/config/model`: set/update backend model.

认证方案（规划） / Authentication (Planned)
- API Key：通过 `Authorization: Bearer <token>` 或 `X-API-Key` 传递。
- API Key: via `Authorization: Bearer <token>` or `X-API-Key`.
- OAuth2：支持标准授权流程与令牌管理。
- OAuth2: standard authorization and token management.
- 服务账号：支持密钥文件/环境变量方式加载凭据。
- Service Account: load credentials via key files or env vars.

模型配置（规划） / Model Configuration (Planned)
- 使用环境变量或配置文件声明模型供应商与模型 ID，例如：
- Declare provider and model via env vars or config, e.g.:
  - `MODEL_PROVIDER`（如：vertex、openai、自定义） / `MODEL_PROVIDER` (vertex, openai, custom)
  - `MODEL_ID`（具体模型标识） / `MODEL_ID` (specific model name)
  - 其他必要的端点与鉴权配置 / additional endpoints and auth settings

快速开始（当前代码暂不变） / Quick Start (No Code Changes Yet)
- 安装依赖：`npm install`
- Install dependencies: `npm install`
- 构建：`npm run build`
- Build: `npm run build`
- 启动 Web 服务（可用于预览）：`npm run start --workspace @google/gemini-web-server`
- Start web server for preview: `npm run start --workspace @google/gemini-web-server`
- 默认端口可能为 `3000` 或 `3001`
- Default port may be `3000` or `3001`

迁移说明 / Migration Notes
- CLI 将逐步移除，统一以 Web API 暴露能力。
- CLI interface will be removed; capabilities exposed via Web API.
- 现有扩展机制将保留并在扩展管理页面中可视化。
- Existing extension mechanism stays, with a management UI.
- 认证与模型配置将抽象为统一接口与配置入口。
- Auth and model configuration will be unified via common abstractions.

路线图（里程碑） / Roadmap (Milestones)
- 移除 CLI 包并清理相关依赖。
- Remove CLI package and related dependencies.
- 抽象并实现模型适配层与统一调用接口。
- Implement model adapter layer and unified invocation.
- 完善认证模块（API Key、OAuth2、服务账号）。
- Build authentication module (API Key, OAuth2, Service Account).
- 发布稳定的 Web API（含同步与流式返回）。
- Release stable Web API (sync and streaming).
- 实现扩展管理页面与扩展生命周期管理。
- Implement extension management UI and lifecycle.
- 完善文档与示例、用例与测试。
- Improve docs, examples, use cases, and tests.

致谢与来源 / Attribution
- 本项目源自并基于 Gemini CLI 开源项目，并在其基础上演进为更通用的智能体（AI Agent）框架。
- This project originates from and is based on the open-source Gemini CLI, and evolves on top of it into a general AI Agent framework.

许可与贡献 / License & Contributing
- 许可：详见仓库 `LICENSE`
- License: see repository `LICENSE`.
- 贡献：欢迎通过 Issue/PR 参与，贡献指南参见 `CONTRIBUTING.md`
- Contributions: welcome via Issues/PRs; see `CONTRIBUTING.md`.
