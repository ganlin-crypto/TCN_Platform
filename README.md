# TCN Platform

**TokenCap Network (TCN)** — Private collaboration registry for the 2678 Holdings ecosystem.

## What is TCN?

TCN is a token-gated collaboration infrastructure platform where:
- **Project submitters** list structured business collaboration opportunities
- **Verified participants** (TCT holders) browse, signal interest, and initiate collaboration
- **Admins** review listings, enforce governance rules, and maintain audit logs

## Repository Structure

```
TCN_Platform/
  tcn-platform/          ← Next.js web application (App Router + Supabase)
  PROJECT_BRIEF.md       ← Full project specification and design rules
  TCNWFT_D0_DECISIONS.md ← Smart contract architecture decisions (Phase D)
  TCN_MASTER_PLAN.md     ← Development roadmap and phase tracker
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React 19, Tailwind CSS v4 |
| Backend | Next.js API routes |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (Phase A); TCM API (Phase C) |
| Blockchain (Phase D) | Polygon PoS, Solidity 0.8.26, Hardhat, OpenZeppelin |
| Deployment | Vercel |

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| A | MVP Foundation (auth, listings, admin, audit) | In Progress |
| B | Collaboration Layer (messaging, documents) | Planned |
| C | TCM Integration (TCT credential auth) | Planned |
| D | Smart Contract Layer (EntityFormation, FundMovement, Workflow) | Planned |

## Key Design Rules

- **Entity separation** — TCN never performs TCM (token issuance, KYC) or TCA (analytics) functions
- **No funds handling** — TCN never receives, holds, or transmits money
- **Reporter-not-determiner** — Smart contracts surface externally-determined facts only
- **Full audit logging** — Every platform event logged with timestamp, user ID, and action type
- **SDN Kill Switch** — OFAC-designated participants deactivated immediately via TCT_GATEWAY_ROLE

## Related Repositories

- [TCM (TokenCap Miner)](https://github.com/stan241/TCM) — Token issuance and KYC infrastructure

---

TokenCap Network LLC · 2678 Holdings Ecosystem
