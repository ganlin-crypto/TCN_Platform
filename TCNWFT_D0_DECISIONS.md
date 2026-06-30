# TCNWFT — Phase D0 架构决策记录
# TokenCap Network LLC · 2678 Holdings Ecosystem

**创建日期：2026-06-10**
**最后更新：2026-06-30（依据 TCN_SmartContract_TechSpec_v1.6 全面更新）**
**状态：D0全部决策已定，可开始D1合约编写**

---

## 背景

TCN Smart Contract 系统部署在 Polygon PoS 上，共4个合约，分2个Phase。
核心原则：**Reporter-not-determiner** — 合约只记录外部已确定的事实，不计算或派生经济结果。

---

## D0.1 · 工作流类型定义

**状态：✅ 已定**

| 项目 | 决定 |
|------|------|
| 工作流类型 | **单一通用工作流** — 所有行业共用同一套状态机 |
| 行业差异处理 | **configHash 模型** — 行业规则存于链外配置文档，其哈希值锚定在链上 |
| 参与者数量 | 无限制，受限于链外实体协议条款 |
| 触发方 | TCT Owner 在平台选择项目后，由 TCN 后端创建工作流 |

---

## D0.2 · WorkflowStatus 状态机

**状态：✅ 已定（依据 v1.6 Section 8）**

### 10个参与者状态

| 状态 | 含义 | 进入方式 | 离开方式 |
|------|------|---------|---------|
| `None` | 持有TCT但未参与此项目 | 起始点 | 工作流启动 |
| `FormationPending` | 业务组织者已介入，实体成立进行中 | 工作流启动 / EntityFormationRevoked（回退） | EntityFormationReported |
| `Enrolled` | 实体成立已链上确认，等待资金确认 | EntityFormationReported | FundMovementAcknowledged / EntityFormationRevoked（回退） |
| `Active` | 两个条件均满足（实体+资金），正式TCT Participant | FundMovementAcknowledged | 里程碑提交 / 合规事件 |
| `MilestonePending` | 里程碑已提交，在Halt窗口等待 | 里程碑上报 | Halt窗口到期（自动推进）/ 收到Halt |
| `MilestoneAchieved` | Halt窗口内无人反对，里程碑自动推进 | 自动推进 / Halt解决 | 下一里程碑提交 / 项目结束 |
| `MilestoneRejected` | 参与者在窗口内提出Halt | 参与者主动Halt | 链外解决后重新提交 |
| `Suspended` | 合规暂停，无法操作，可恢复 | 合规事件 / 治理暂停 | 暂停解除（回Active）/ 永久化（Revoked） |
| `Concluded` | 参与正式结束，终态 | WorkflowConcluded | 终态，不可离开 |
| `Revoked` | Kill Switch执行，永久终态 | WorkflowParticipantRevoked | 终态，不可离开 |

### 状态转换约束
- 状态不可跳跃，必须按序推进
- 唯一的回退路径：`Enrolled → FormationPending`（EntityFormationRevoked，且只在Fund确认前）
- `Active` 状态到达后，不允许任何记录修正
- `Revoked` 和 `Concluded` 是永久终态

---

## D0.3 · 系统角色定义

**状态：✅ 已定（依据 v1.6 Section 9）**

| 角色 | 权限 | 关键约束 |
|------|------|---------|
| `DEFAULT_ADMIN_ROLE` | 管理角色分配 | 需要多签治理；不得与任何运营角色重叠 |
| `WORKFLOW_ADMIN_ROLE` | 创建/归档工作流；执行Kill Switch；正式结束项目；共同授权记录修正 | 不得与Workflow Manager是同一签署人；Kill Switch立即执行 |
| `WORKFLOW_MANAGER_ROLE` | 在Fund确认后将参与者纳入工作流 | 不得与STATE_TRANSITION_ROLE重叠（不同签署人） |
| `STATE_TRANSITION_ROLE` | 记录工作流状态变更、里程碑和Halt | 不得与WORKFLOW_MANAGER_ROLE重叠 |
| `REPORTING_ROLE` | 写EntityFormationMessage和FundMovementMessage；写结果消息；发起记录修正 | 可读取参与者数据；不得改变工作流状态；修正需与WORKFLOW_ADMIN双重授权 |
| `TCT_GATEWAY_ROLE` | 验证TCT授权；接收TCM的Kill Switch通知并传递给Workflow Admin | 全自动，无人工干预 |
| `PAUSER_ROLE` | 紧急暂停所有写操作 | 每次使用均记录审计；需on-call多签 |

---

## D0.4 · Token ID Bit-Packing 方案

**状态：🔶 Phase 2前决定（Phase 1合约不涉及ERC-1155 Token ID）**

草稿方案（待Phase 2前确认）：
```
| 位段      | 长度   | 内容                                        |
|-----------|--------|---------------------------------------------|
| [255:240] | 16 bit | Token Class (Participation=1, Role=2, State=3) |
| [239:192] | 48 bit | Workflow ID                                 |
| [191:128] | 64 bit | Participant/Role ID                         |
| [127:64]  | 64 bit | 保留（Phase 2扩展）                          |
| [63:0]    | 64 bit | 时间戳 or 序列号                             |
```

---

## D0.5 · 16个链上事件（完整列表）

**状态：✅ 已定（依据 v1.6 Section 11）**

| 事件名 | 所属合约 | 触发时机 |
|--------|---------|---------|
| `EntityFormationReported` | EntityFormationMessage | 业务组织者确认实体成立 |
| `EntityFormationRevoked` | EntityFormationMessage | 实体成立被撤销（Fund确认前） |
| `FundMovementAcknowledged` | FundMovementMessage | MSB确认资金到托管账户 |
| `WorkflowCreated` | TCNWorkflowRegistry | 新工作流创建 |
| `WorkflowParticipantAdded` | TCNWorkflow1155 | 参与者正式纳入工作流 |
| `WorkflowStateRecorded` | TCNWorkflow1155 | 任何参与者状态变更 |
| `WorkflowMilestoneAchieved` | TCNWorkflow1155 | Halt窗口到期无人反对，自动推进 |
| `WorkflowMilestoneRejected` | TCNWorkflow1155 | 参与者在窗口内提出Halt |
| `WorkflowReportingMessageReceived` | TCNWorkflowRegistry | 接收外部报告消息 |
| `CapTableConfirmed` | TCNWorkflowRegistry | 股权表确认（仅存引用，无金额） |
| `RecordSuperseded` | TCNWorkflowRegistry | 记录被标记为已超越（原记录永久保留） |
| `CorrectionReported` | TCNWorkflowRegistry | 修正记录（双重授权，仅Active前） |
| `SDNDesignationReceived` | TCNWorkflowRegistry | TCM通知制裁名单指定，触发Kill Switch |
| `WorkflowParticipantRevoked` | TCNWorkflow1155 | Kill Switch执行完成，永久Revoked |
| `WorkflowSuspended` | TCNWorkflow1155 | 工作流合规暂停 |
| `WorkflowConcluded` | TCNWorkflow1155 | 参与者正式结束，恢复TCT Owner状态 |

**所有事件的共同约束：**
- 每个事件必须包含 `sourceRef` 字段（指向链外权威文件）
- 任何事件均不得包含经济金额或百分比数值

---

## D0.6 · 钱包地址 ↔ TCM UUID 映射机制

**状态：✅ 已定（依据 v1.6 Q2 + TCM mintService.ts 分析）**

| 项目 | 决定 |
|------|------|
| 链上身份标识 | **TCT钱包地址**（TCM颁发TCT时 `mintAndActivate(holder_address, ...)` 绑定） |
| 映射由谁管理 | **TCM** — 在Gate 4铸币时完成钱包地址与链下UUID的绑定 |
| TCN的责任 | 无需自己管理映射，从TCM的 `validate-token` API取得钱包地址后直接使用 |
| 地址管理 | TCN不发行、不生成、不独立管理地址 |

---

## D0.7 · 开发环境选型

**状态：✅ 已定（2026-06-30 更新，与TCM对齐）**

| 项目 | 选择 | 备注 |
|------|------|------|
| 目标链 | **Polygon PoS** | chainId: 137 |
| 测试网 | **Amoy** | chainId: 80002（Polygon官方测试网） |
| 开发框架 | **Hardhat** | TypeScript生态，与Next.js一致 |
| 合约库 | **OpenZeppelin** | AccessControl + Pausable + ERC-1155 |
| 语言 | **Solidity 0.8.26** | ⚠️ 与TCM对齐（非0.8.20） |
| evmVersion | **cancun** | 与TCM的hardhat.config.ts完全一致 |
| optimizer | runs: 200，viaIR: true | 与TCM完全一致 |
| RPC提供商 | **Alchemy** | 与TCM相同（需注册账号获取API Key） |
| TypeScript绑定 | **ethers v6** | `ethers.JsonRpcProvider`，与TCM一致 |
| 开发策略 | **原型优先** | 先写简化版验证结构，再写生产版 |

---

## 待决定清单

- [x] D0.1 工作流类型（通用单一，configHash处理行业差异）
- [x] D0.2 状态机（10个状态，完整转换规则）
- [x] D0.3 角色定义（7个角色，权限边界）
- [ ] D0.4 Token ID编码（Phase 2开始前确认）
- [x] D0.5 事件Schema（16个事件完整定义）
- [x] D0.6 钱包映射机制（使用TCT钱包地址，TCM负责绑定）
- [x] D0.7 开发环境（Polygon/Amoy/Hardhat/OZ/Solidity 0.8.26/ethers v6）

---

*D0.1–D0.3、D0.5–D0.7 全部完成，开始D1合约编写。D0.4 在 TCNWorkflow1155（Phase 2）开始前确认。*
