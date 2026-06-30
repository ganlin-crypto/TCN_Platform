# TCNWFT — Phase D0 架构决策记录
# TokenCap Network LLC · 2678 Holdings Ecosystem

**创建日期：2026-06-10**
**状态：进行中**
**用途：D1/D2 合约开发的前置设计基础**

---

## 背景

TCNWFT（TokenCap Network Workflow Token）是部署在以太坊上的 ERC-1155 智能合约系统。
核心原则：**Reporter-not-determiner** — 合约只记录外部已确定的事实，不计算或派生经济结果。

---

## D0.1 · 工作流类型定义

> 每种工作流的参与者、触发条件、入口要求

**状态：已决定**

| 项目 | 决定 |
|------|------|
| 工作流类型 | **单一通用工作流** — 所有行业共用同一套状态机，行业信息作为 metadata 标签存储，不影响链上逻辑 |

待确认问题：
- 每个工作流的最少/最多参与者数量？
- 工作流由谁触发创建？（Admin？Sponsor 自主触发？）

---

## D0.2 · WorkflowStatus 状态机

> 9 个状态的定义及转换规则

**状态：待决定**

待确认的 9 个状态（草稿，待确认）：
```
1. DRAFT           — 工作流已创建，尚未激活
2. ACTIVE          — 工作流进行中
3. PAUSED          — 暂停（可恢复）
4. PENDING_REVIEW  — 等待审核
5. UNDER_REVIEW    — 审核中
6. APPROVED        — 审核通过
7. REJECTED        — 审核拒绝
8. COMPLETED       — 正常完成
9. TERMINATED      — 提前终止
```

待确认问题：
- 以上 9 个状态是否准确？
- 哪些状态之间可以跳转？（状态转换矩阵）
- 每个状态转换需要哪个角色授权？

---

## D0.3 · WorkflowRole 角色定义

> 6 个角色的权限边界

**状态：待决定**

草稿角色定义：
| 角色 | 职责 | 备注 |
|------|------|------|
| Sponsor | 发起工作流，提供项目 | 对应 TCN 的 Submitter |
| Manager | 管理工作流运行 | 对应 TCN 的 Admin |
| Participant | 参与协作 | 对应 TCN 的 TCT Participant |
| Reviewer | 审核工作流状态 | 独立第三方？ |
| Validator | 验证链上事实 | 对应外部机构确认 |
| Observer | 只读查看 | 对应 TCN 的 TCT Owner |

待确认问题：
- 以上角色定义是否准确？
- Reviewer 和 Validator 的区别是什么？由谁担任？
- 角色是否可以叠加？（同一地址可以是 Participant + Reviewer 吗？）

---

## D0.4 · Token ID Bit-Packing 方案

> ERC-1155 Token ID 的编码结构（256 bit）

**状态：待决定**

草稿方案（待确认）：
```
| 位段      | 长度   | 内容                          |
|-----------|--------|-------------------------------|
| [255:240] | 16 bit | Token Class (Participation=1, Role=2, State=3) |
| [239:192] | 48 bit | Workflow ID                   |
| [191:128] | 64 bit | Participant/Role ID            |
| [127:64]  | 64 bit | 保留（Phase D2 扩展）          |
| [63:0]    | 64 bit | 时间戳 or 序列号               |
```

待确认问题：
- 预计工作流总数量级？（影响 Workflow ID 位数）
- 预计参与者总数量级？
- Token Class 除了 3 种，有没有扩展可能？

---

## D0.5 · 事件 Schema（5 类链上事件）

> 合约 emit 的事件结构（一旦冻结不可更改）

**状态：待决定**

草稿事件定义：
```solidity
// 1. 工作流创建
event WorkflowCreated(uint256 indexed workflowId, address indexed sponsor, uint256 timestamp);

// 2. 参与者加入
event ParticipantJoined(uint256 indexed workflowId, address indexed participant, uint256 role, uint256 timestamp);

// 3. 状态变更
event WorkflowStatusChanged(uint256 indexed workflowId, uint8 fromStatus, uint8 toStatus, address indexed triggeredBy, uint256 timestamp);

// 4. 资金转账确认记录（仅记录外部已确认的事实）
event FundMovementConfirmed(uint256 indexed workflowId, bytes32 externalRef, address indexed confirmedBy, uint256 timestamp);

// 5. 实体成立确认记录
event EntityFormationConfirmed(uint256 indexed workflowId, bytes32 externalRef, address indexed confirmedBy, uint256 timestamp);
```

待确认问题：
- 5 类事件是否完整？有没有遗漏的关键事件？
- `externalRef` 的格式？（交易哈希？UUID？）
- 事件里需要存哪些参数？

---

## D0.6 · 钱包地址 ↔ TCM UUID 映射机制

> 链上地址与链下身份的绑定方案

**状态：待决定**

待确认问题：
- TCM 颁发 TCT 时，会同时绑定一个以太坊钱包地址吗？
- 映射关系存在链上还是链下（数据库）？
- 一个 TCM UUID 可以绑定多个钱包地址吗？

---

## D0.7 · 开发环境选型

**状态：已决定**

| 项目 | 选择 | 理由 |
|------|------|------|
| 目标链 | **Polygon** | Gas 费极低，适合频繁状态记录；EVM 兼容，Solidity 代码完全通用 |
| 开发框架 | **Hardhat** | TypeScript 生态，与 Next.js 项目一致，文档丰富，适合入门 |
| 测试网 | **Amoy** | Polygon 官方测试网（替代已弃用的 Mumbai） |
| 合约库 | **OpenZeppelin** | ERC-1155 + AccessControl 标准实现 |
| 语言 | **Solidity ^0.8.20** | EVM 标准语言，Polygon 与以太坊完全兼容 |
| 开发策略 | **原型优先** | 先写简化版验证结构，再写生产版 |

---

## 待决定清单

- [ ] D0.1 工作流类型（几种？触发条件？）
- [ ] D0.2 状态机（9个状态确认 + 转换矩阵）
- [ ] D0.3 角色定义（6个角色边界确认）
- [ ] D0.4 Token ID 编码（位段分配确认）
- [ ] D0.5 事件 Schema（5类事件结构确认）
- [ ] D0.6 钱包 ↔ UUID 映射机制

---

*本文件随决策过程持续更新。决策全部完成后即可开始 D1 合约编写。*
