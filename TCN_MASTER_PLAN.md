# TCN Platform — Master Development Plan
# TokenCap Network LLC · 2678 Holdings Ecosystem

**最后更新：2026-06-09**
**当前阶段：Phase A — MVP Foundation**
**整体进度：██████████░░░░░░░░░░ 50%**

---

## 总览

```
Phase A  ████████████░░░░  MVP Foundation        ← 当前
Phase B  ░░░░░░░░░░░░░░░░  Collaboration Layer
Phase C  ░░░░░░░░░░░░░░░░  TCM Integration
Phase D  ░░░░░░░░░░░░░░░░  TCNWFT Smart Contracts
```

---

## Phase A — MVP Foundation
**目标：** 一个真实可用、数据持久化、可公开访问的平台基础

### A1 · UI 原型 ✅ 完成
- [x] Next.js 16 + Tailwind CSS v4 项目初始化
- [x] 设计系统（配色 / 字体 / dot grid 背景 / 动画）
- [x] TCN 真实 Logo 接入
- [x] 登录页（4 个角色入口：TCT Owner / TCT Participant / Submitter / Admin）
- [x] TCT Owner 仪表盘（只读浏览，Signal Interest 锁定）
- [x] TCT Participant 仪表盘（完整访问，可 Signal Interest）
- [x] Listing 详情页（含合规免责声明）
- [x] Project Submitter 仪表盘 + 提交表单
- [x] Admin 审批队列（Approve / Request Info / Reject 三操作）
- [x] Admin 审计日志页
- [x] Listing 状态机（pending / info_requested / approved / rejected / archived）
- [x] TCT Owner vs TCT Participant 访问层级区分

---

### A2 · Supabase 数据库接入 ✅ 完成
- [x] 在 Supabase 创建项目（ganlin@2678holdings.com's Project）
- [x] 设计并创建 6 张核心表
  - [x] `users`（账户信息、角色、UUID）
  - [x] `listings`（项目列表完整结构）
  - [x] `collaboration_signals`（参与者对 listing 的意向记录）
  - [x] `messages`（participant ↔ submitter 通讯，Phase B 用）
  - [x] `audit_logs`（所有平台事件，含 timestamp / user_id / action）
  - [x] `documents`（文件共享，Phase B 用）
- [x] 预留未来扩展表（现在建空表）
  - [x] `workflow_events`（链上事件引用）
  - [x] `tcnwft_tokens`（TCNWFT token 记录）
  - [x] `fund_movement_refs`（资金转账确认引用）
  - [x] `entity_formation_refs`（实体成立确认引用）
- [x] 配置 Row Level Security（RLS）权限规则（Phase A 临时开放策略）
- [x] 环境变量配置（`.env.local`）
- [x] 安装 @supabase/supabase-js，创建 `src/lib/supabase.ts` 客户端
- [x] 创建 `src/lib/db.ts` 数据库操作层（完整 CRUD）
- [x] 导入全部 mock 数据（8 条 listing + 16 条审计日志）
- [x] 所有页面切换为真实数据库（替换 mockData）
  - [x] Participant / TCT Owner 仪表盘
  - [x] Listing 详情页（participant + tct-owner）
  - [x] Admin 审批队列（Approve/RequestInfo/Reject 写入 DB + 审计日志）
  - [x] Admin 审计日志页
  - [x] Submitter 仪表盘
  - [x] Submitter 提交表单（写入 DB + 审计日志 + 真实 ID）

---

### A3 · 真实认证系统 ⬜ 待开始
- [ ] 接入 Supabase Auth（邮箱 / 密码注册登录）
- [ ] 角色存入数据库（`user_metadata.role`）
- [ ] 登录后根据角色自动跳转对应仪表盘
- [ ] Session 管理（登录状态保持）
- [ ] 登出功能（真实清除 session）
- [ ] 受保护路由（未登录跳回 /login）
- [ ] 注册流程（邮箱验证）

---

### A4 · 数据层替换（Mock → 真实 API）⬜ 待开始
- [ ] Listing 提交写入数据库（Submitter 提交表单）
- [ ] Listing 列表从数据库读取（Participant 浏览）
- [ ] Admin 审批操作写入数据库（状态变更持久化）
- [ ] Signal Interest 写入 `collaboration_signals` 表
- [ ] 所有操作写入 `audit_logs`（完整审计链）
- [ ] 分页（listing 列表支持大量数据）

---

### A5 · 部署上线 ⬜ 待开始
- [ ] 连接 GitHub 仓库（项目代码推送）
- [ ] Vercel 项目创建 + 连接 GitHub
- [ ] 环境变量配置到 Vercel（Supabase keys）
- [ ] 自动部署验证（push → 自动部署）
- [ ] 生产环境测试（所有页面 + 功能）
- [ ] 自定义域名（可选）

**Phase A 完成标志：** 平台有公开 URL，可以真实注册登录，数据持久化，所有操作有审计记录。

---

## Phase B — Collaboration Layer
**目标：** Signal Interest 之后真正能沟通协作
**预计开始：** Phase A 完成后

### B1 · 消息系统 ⬜ 待开始
- [ ] Participant ↔ Submitter 站内消息（Signal Interest 触发开通通道）
- [ ] 消息界面（对话 UI，类似 inbox）
- [ ] 消息通知（新消息提醒）
- [ ] 所有消息写入审计日志（不可篡改）

### B2 · 文件共享 ⬜ 待开始
- [ ] Submitter 上传项目文件（NDA、资料包等）
- [ ] Participant 访问文件（权限控制）
- [ ] Supabase Storage 接入
- [ ] 文件访问记录写入审计日志

### B3 · 通知系统 ⬜ 待开始
- [ ] 邮件通知（新 listing 审批结果 / 新消息 / 新 signal）
- [ ] 接入邮件服务（Resend 或 SendGrid）
- [ ] 站内通知 badge

### B4 · 增强审计追踪 ⬜ 待开始
- [ ] 完整事件类型覆盖（消息发送 / 文件访问 / 状态变更）
- [ ] 审计日志导出功能（Admin）
- [ ] 5 年留存策略设置（FinCEN/BSA 要求）

**Phase B 完成标志：** Participant 和 Submitter 可以在平台内完成从"发现 → 表达兴趣 → 安全沟通 → 文件交换"的完整协作流程。

---

## Phase C — TCM Integration
**目标：** 用真实 TCT 凭证替换邮箱/密码认证
**前置条件：** TCM 平台建成并有可用 API
**预计开始：** TCM 就绪后

### C1 · TCM API 对接 ⬜ 待开始
- [ ] 定义 TCM ↔ TCN API 接口规范（4 个端点）
  - Token Issuance API
  - Token Verification API（实时验证 TCT 状态）
  - Compliance Status API
  - Revocation API
- [ ] 版本化 API 合约（防止单方面变更破坏集成）
- [ ] 无直接数据库访问（TCM 和 TCN 数据库完全隔离）

### C2 · 认证替换 ⬜ 待开始
- [ ] 登录流程改为 TCT 凭证验证
- [ ] 实时 Token 状态验证（Active / Suspended / Revoked）
- [ ] TCT Owner vs TCT Participant 由链上状态驱动（不再是 mock）
- [ ] Suspended / Revoked TCT 立即失去访问权限

### C3 · SDN Kill Switch ⬜ 待开始
- [ ] 实现 `TCT_GATEWAY_ROLE` 接收 OFAC 通知
- [ ] 双重授权机制（两人确认才能触发）
- [ ] 触发后立即吊销该参与者所有 token 权限
- [ ] 完整事件记录（审计 + 时间戳）

**Phase C 完成标志：** 平台接入真实 TCT 凭证体系，合规验证闭环，OFAC 应急机制就位。

---

## Phase D — TCNWFT Smart Contracts
**目标：** 链上工作流执行和状态记录
**硬性 Deadline：** 基础合约 2026 年 6 月 30 日
**预计预算：** $340,000 – $560,000

### D0 · 合约开发前置决策 ⬜ 待完成（必须先于 D1）
- [ ] 工作流类型定义（每种工作流的参与者、状态、入口条件）
- [ ] 状态转换矩阵（哪些状态转换被允许/禁止，谁有权限触发）
- [ ] 角色分类表最终确认（Sponsor / Manager / Participant / Reviewer / Validator / Observer）
- [ ] Token ID 编码方案（bit-packing 结构最终确定）
- [ ] 事件 Schema 冻结（与 TCM Sync 联合确认，5 类事件结构）
- [ ] Wallet 与身份模型（链上地址 ↔ TCM UUID 映射机制）

### D1 · 基础合约（Deadline: 2026-06-30）⬜ 待开始
- [ ] `EntityFormationMessage` 合约（实体成立确认记录）
- [ ] `FundMovementMessage` 合约（资金转账确认记录）
- [ ] 资金转账确认时序设计（确认收款 → 触发铸造，非发出指令时触发）

### D2 · TCNWorkflow1155 核心合约（目标：2026-07）⬜ 待开始
- [ ] ERC-1155 合约开发（三类 token：Participation / Role / State）
- [ ] Token ID bit-packing 实现
- [ ] WorkflowStatus 状态机实现（9 个状态）
- [ ] WorkflowRole 实现（6 个角色）
- [ ] OpenZeppelin AccessControl（6 个角色权限）
- [ ] Reporter-not-determiner 约束在代码审查中强制执行

### D3 · TCNWorkflowRegistry ⬜ 待开始
- [ ] 注册合约（工作流注册 + 查询）
- [ ] Deployment tooling

### D4 · 平台集成 ⬜ 待开始
- [ ] 接入 `ethers.js` 或 `viem`（后端调用合约）
- [ ] Event Indexer 服务（监听链上事件 → 写入数据库）
- [ ] TCM Sync 协议（链上事件 → TCT outcome_refs 更新）
- [ ] 前端 Workflow 状态展示（从数据库读，不直接读链）
- [ ] 报告仪表盘 v1（Reporter-not-determiner 合规展示）

### D5 · 独立审计 ⬜ 待开始
- [ ] 委托独立智能合约审计机构
- [ ] 审计发现修复
- [ ] 审计报告存档

**Phase D 完成标志：** TCNWFT token 可以被真实铸造和追踪，工作流执行状态上链存证，TCM 同步完成闭环。

---

## 技术债务 & 持续事项

- [ ] 单元测试（关键 API 路由）
- [ ] 错误边界处理（404 / 500 页面）
- [ ] 移动端响应式优化
- [ ] 性能优化（大量 listing 时的分页 / 缓存）
- [ ] 安全加固（CSP headers / rate limiting）
- [ ] GDPR 数据删除工作流（当 TCM 接入后）

---

## 里程碑时间线（参考）

| 里程碑 | 目标时间 | 状态 |
|--------|----------|------|
| Phase A UI 原型 | ✓ 已完成 | ✅ |
| Phase A 全部完成（Supabase + 部署） | 待定 | ⬜ |
| Phase B 完成 | 待定 | ⬜ |
| Phase C 完成（取决于 TCM） | 待定 | ⬜ |
| Phase D 基础合约 | **2026-06-30** | ⬜ |
| Phase D 核心合约 | **2026-07** | ⬜ |
| Phase D 独立审计完成 | 待定 | ⬜ |

---

## 设计原则（开发全程遵守）

1. **实体分离** — TCN 代码永远不执行 TCM（发 token / KYC）或 TCA（投资建议）的功能
2. **不碰资金** — TCN 永远不接收、持有或传输资金
3. **无经济权利语言** — 界面和合约不得暗示 listing 代表投资机会
4. **完整审计日志** — 每个重要操作必须记录（时间戳 + 用户 ID + 动作类型）
5. **基础设施中立** — TCN 不推荐、不宣传、不组建协作群体
6. **Reporter-not-determiner** — 合约只记录外部确定的事实，不计算经济结果
7. **SDN Kill Switch** — OFAC 制裁触发即时双重授权停用

---

*本文件由 Claude Code 维护。每完成一个步骤后自动更新进度。*
