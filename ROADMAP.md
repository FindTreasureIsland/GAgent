# GAgent 路线图 / GAgent Roadmap

愿景与目标 / Vision & Goals
- 去掉 CLI 交互界面，能力通过 Web API 暴露。
- Remove the CLI UI; expose capabilities via Web API.
- 提供通用认证抽象：API Key、OAuth2、服务账号。
- Provide generalized authentication abstraction: API Key, OAuth2, Service Account.
- 支持可配置的后端模型与多供应商接入。
- Support configurable backend models and multiple providers.
- 提供 Agent 扩展管理页面（安装、启用/禁用、配置）。
- Provide an Agent extension management page (install/enable/disable/configure).
- 维持良好开发者体验：清晰的接口规范、示例与文档。
- Maintain developer experience: clear API specs, examples, documentation.

阶段里程碑 / Milestones
- M0 文档与基线：更新 README/ROADMAP，梳理包结构与依赖，输出 Web API/认证/模型配置草案。
- M0 Documentation & Baseline: update README/ROADMAP, review packages/dependencies, draft Web API/auth/model config.
- M1 移除 CLI 界面：废弃 CLI 入口与命令，清理构建脚本与文档示例，确保构建与回归验证通过。
- M1 Remove CLI UI: deprecate CLI entry/commands, clean build scripts/docs, ensure build and basic regression pass.
- M2 通用认证抽象：设计统一 `CredentialProvider` 接口与加载/刷新策略，提供最小可用实现与示例。
- M2 Authentication Abstraction: design unified `CredentialProvider` and loading/refresh strategies; deliver minimal viable implementation and examples.
- M3 Web API 服务：实现核心路由（`POST /v1/agents/:agentId/invoke`、`POST /v1/agents/:agentId/stream`）、错误码/响应结构、日志与健康检查（`/healthz`、`/metrics`）。
- M3 Web API Service: implement core routes (`POST /v1/agents/:agentId/invoke`, `POST /v1/agents/:agentId/stream`), error codes/response shapes, logging and health (`/healthz`, `/metrics`).
- M4 模型适配层：抽象供应商接口，支持基于 `MODEL_PROVIDER`、`MODEL_ID` 的动态选择，加入重试/超时/限流策略。
- M4 Model Adapter Layer: abstract providers; dynamic selection via `MODEL_PROVIDER`, `MODEL_ID`; add retry/timeout/rate-limit.
- M5 扩展管理页面：扩展列表、安装、启用/禁用与配置；扩展生命周期与权限模型；扩展开发指南。
- M5 Extension Management Page: list/install/enable/disable/configure; lifecycle and permission model; extension developer guide.
- M6 发布与运维：部署示例，完善文档/示例/测试，版本化发布策略与稳定渠道。
- M6 Release & Operations: deployment examples; refine docs/examples/tests; versioned releases and stable channels.

兼容与迁移 / Compatibility & Migration
- CLI 将逐步移除，过渡期文档与示例双轨提供；最终统一至 Web API。
- CLI will be gradually removed; during transition, provide dual-track docs/examples; eventually converge on Web API.
- 保持包结构与导入路径的兼容期，后续统一更名为 GAgent 命名空间。
- Maintain compatibility window for package structure/imports; later unify under the GAgent namespace.
- 每次发布提供迁移指引与弃用说明。
- Provide migration guides and deprecation notes for each release.

成功度量 / Success Metrics
- Web API 稳定性与性能（例如 p99 延迟、错误率）。
- Web API stability and performance (e.g., p99 latency, error rate).
- 认证成功率与凭据刷新稳定性。
- Authentication success rate and credential refresh stability.
- 模型适配与多供应商兼容性（回归测试通过率）。
- Model adapter compatibility across providers (regression pass rate).
- 扩展管理页面功能完备性与安装/调用成功率。
- Extension management completeness and install/invoke success rates.

风险与缓解 / Risks & Mitigation
- 依赖与版本变更导致构建问题 → 锁版本、CI 回归与预览渠道。
- Dependency/version changes causing build issues → lock versions, CI regressions, preview channels.
- 多模型接入差异较大 → 强化适配层接口契约与错误处理。
- Large provider differences → strengthen adapter contracts and error handling.
- OAuth2 流程复杂度与环境差异 → 提供 API Key 等备选路径与清晰文档。
- OAuth2 complexity/environment differences → provide API Key fallback and clear documentation.

时间线建议（可调整） / Suggested Timeline (Adjustable)
- Week 1–2：文档与设计（M0），API/认证/模型草案。
- Week 1–2: documentation and design (M0), drafts for API/auth/model.
- Week 3–4：认证抽象与 Web API 初版（M2/M3）。
- Week 3–4: auth abstraction and Web API alpha (M2/M3).
- Week 5–6：模型适配层与扩展管理页面 Beta（M4/M5）。
- Week 5–6: model adapter layer and extension management page beta (M4/M5).
- Week 7+：稳定化、发布与运维（M6）。
- Week 7+: stabilization, release, and operations (M6).

当前状态 / Current Status
- 已完成：README 对齐至 GAgent 目标；Web Server 可用于本地预览。
- Done: README aligned to GAgent goals; Web Server available for local preview.
- 下一步：按路线图推进 M1–M3 的设计与文档细化。
- Next: advance design and documentation for M1–M3 per roadmap.
