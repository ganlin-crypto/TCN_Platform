# PROJECT BRIEF — 2678 Holdings Ecosystem
## For use in Claude Code sessions

> **How to use this file:** At the start of every Claude Code session, say:
> "Read PROJECT_BRIEF.md and use it as context for everything we build."

---

## 1. Project Overview

We are building the **TokenCap Network (TCN)** platform — a secure, token-gated collaboration infrastructure for the **2678 Holdings** ecosystem.

The ecosystem has three separate legal entities that must remain structurally separated at all times:

| Entity | Full Name | Role |
|--------|-----------|------|
| **TCM** | TokenCap Miner LLC | Issues and governs the TokenCap Token (TCT). Handles KYC/AML compliance. |
| **TCN** | TokenCap Network LLC | Collaboration infrastructure platform. Hosts project listings. This is what we are building. |
| **TCA** | TokenCap Advisors LLC | Risk intelligence and analytics. Downstream consumer of data. |

**Current development scope:** TCN platform only. TCM integration will come later. TCNWFT is deferred.

---

## 2. What is TCN?

TCN is a **private collaboration registry** — a platform where:

- **Project submitters** list structured business collaboration opportunities
- **Verified participants** (TCT holders) browse, signal interest, and initiate collaboration
- **Admins** review listings, enforce governance rules, and maintain audit logs

Think of it as a **private deal network** — not a marketplace, not a social network. TCN is neutral infrastructure. It does not originate ventures, promote opportunities, or assemble groups. Participants independently decide whether to collaborate.

---

## 3. The TokenCap Token (TCT)

- Issued by TCM (not TCN)
- A **non-transferable, non-tradeable** digital credential — NOT a cryptocurrency
- Functions as a **permissioned access key** to the TCN platform
- Has 5 lifecycle states: `Pending → Active → Suspended → Revoked → Expired`
- No economic rights, no financial value representation

**Two participant levels:**
- **TCT Owner** — holds active TCT; can browse listings but has not elected to participate in a project
- **TCT Participant** — TCT Owner who has elected to participate in a specific project AND whose fund transfer has been acknowledged by the receiving financial institution

**For now (Phase 1 of development):** We will use standard email/password authentication as a placeholder. TCT-gated authentication will be integrated later when TCM is built.

---

## 4. TCN Platform Architecture

### Five Core Pillars

**Pillar 1 — Collaboration Registry**
- Project submission portal
- Listing registry database
- Search and browse interface for participants

**Pillar 2 — Token-Gated Access (placeholder: email auth for now)**
- Authentication system
- Role-based access control
- Session management

**Pillar 3 — Collaboration Signaling**
- Participants express interest in listings
- Messaging between participant and project submitter
- Document sharing

**Pillar 4 — Smart Contract Infrastructure** *(future phase — TCNWFT layer)*
- EntityFormationMessage contract (required by June 30, 2026)
- FundMovementMessage contract (required by June 30, 2026)
- TCNWorkflow1155 core contract (Phase 2 — July 2026)
- TCNWorkflowRegistry (Phase 2 — July 2026)

**Pillar 5 — Network Governance**
- Admin review of listings (approve / reject / request more info)
- Audit logging of all platform events
- Monitoring and reporting

### System Layers

```
Platform Layer:     TCN website, project listing portal, participant dashboard
Authentication:     Token-gated auth (email/password now, TCM API later)
Collaboration:      Messaging, signaling tools, document exchange
Smart Contract:     TCNWFT layer — deferred to future phase
Governance:         Listing engine, monitoring, audit logging
```

---

## 5. User Roles

| Role | Description | Access |
|------|-------------|--------|
| **Admin** | TCN staff / governance | Full platform access, listing review, audit logs |
| **TCT Owner / Participant** | Verified TCT holder | Browse listings, signal interest, message submitters |
| **Project Submitter** | External business submitting opportunities | Submit listings, respond to participant inquiries |

---

## 6. Core User Flows

### Project Listing Flow
1. Project submitter registers and submits a collaboration opportunity
2. Admin reviews submission → approves / rejects / requests more info
3. Approved listing is published to the registry
4. Verified participants can browse and view listings

### Participant Access Flow
1. User authenticates (email/password now; TCT validation later)
2. System verifies credential status
3. Authorized participant accesses the platform dashboard
4. Participant can browse listings, signal interest, initiate communication

### Collaboration Signaling Flow
1. Participant views a listing
2. Participant signals interest
3. System notifies project submitter
4. Communication channel opens between participant and submitter
5. Event is logged in audit trail

### TCT Participant Flow (future — when TCNWFT is active)
1. TCT Owner selects a project and elects to participate
2. TCM Auth API confirms TCT Gate
3. TCT Owner issues fund transfer instruction to financial institution
4. Financial institution acknowledges fund receipt → FundMovementMessage contract records this
5. TCT Owner becomes TCT Participant; Minting Order generated
6. TCNWFT tokens minted (Participation Token + Reporting Token)
7. EntityFormationMessage contract surfaces off-chain entity formation → Execution Token minted

---

## 7. Key Design Rules (Non-Negotiable)

These rules come from legal/compliance requirements and must be respected in all code:

1. **Entity separation** — TCN code must never perform TCM functions (token issuance, KYC) or TCA functions (investment advice, analytics)
2. **No funds handling** — TCN must never receive, hold, or transmit money. Any payment references are display-only. The FundMovementMessage contract is a reporter, not an executor.
3. **No economic rights** — The platform must not suggest that listings represent investment opportunities. TCNWFT reports on outcomes determined elsewhere; it does not calculate or hold them.
4. **Full audit logging** — Every significant platform event must be logged with timestamp, user ID, and action type
5. **Infrastructure neutrality** — TCN does not promote, recommend, or assemble collaboration groups
6. **Reporter-not-determiner** — Any smart contract layer must surface externally-determined facts only. It must never calculate, derive, or store economic outcomes.
7. **SDN Kill Switch** — When OFAC designates a participant, TCM notifies TCN via TCT_GATEWAY_ROLE. All that participant's tokens are deactivated immediately. Requires dual authorization.

---

## 8. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | **Next.js** (React) | App router, server-side rendering |
| Backend | **Next.js API routes** | Or separate Express server if needed |
| Database | **Supabase** (PostgreSQL) | Auth, database, and storage in one |
| Authentication | **Supabase Auth** (email/password) | Replace with TCM API later |
| Deployment | **Vercel** | Connects to GitHub, auto-deploys |
| Styling | **Tailwind CSS** | Utility-first CSS |
| Blockchain (future) | **Polygon PoS** | For TCNWFT smart contracts |
| Smart Contract Standard (future) | **ERC-1155** | For TCNWFT token layer |

---

## 9. Database Tables (Core)

```
users                 — platform accounts (participants, submitters, admins)
listings              — project collaboration opportunities
listing_status        — pending / approved / rejected / archived
collaboration_signals — participant interest expressions
messages              — participant ↔ submitter communication
audit_logs            — all significant platform events
```

### Future tables (TCNWFT phase)
```
tcnwft_tokens         — workflow token records per participant per project
workflow_events       — on-chain event references and hashes
fund_movement_refs    — fund transfer acknowledgment references (display only)
entity_formation_refs — entity formation report references (display only)
```

---

## 10. Revenue Model (from TCNWFT memo)

For context when building the admin and billing sections:

| Revenue Stream | Amount | Charged To |
|----------------|--------|------------|
| Network listing fee | $20,000 per project | Project sponsor |
| Minting fee | $1,500 per project | Project entity |
| Utility token fee | $500 per token | Project entity |
| Monthly service fee | $250 per stream | Project entity |
| TCNWFT minting fee (gas) | TBD | Project entity |
| Synchronization service fee | TBD | Project entity |
| Reporting service fee | TBD | Project entity |

Individual TCT Participants are NOT charged directly for token operations.

---

## 11. Development Phases

### Phase A — MVP (Build First — Current Focus)
- [ ] Project setup (Next.js + Supabase + Vercel)
- [ ] User authentication (email/password, role-based)
- [ ] Project listing portal (submit, review, browse)
- [ ] Admin dashboard (approve/reject listings)
- [ ] Participant dashboard (browse listings, signal interest)
- [ ] Basic audit logging

### Phase B — Collaboration Layer
- [ ] Messaging system (participant ↔ submitter)
- [ ] Document sharing
- [ ] Notification system
- [ ] Enhanced audit trail

### Phase C — TCM Integration (when TCM is ready)
- [ ] Replace email auth with TCT credential validation
- [ ] TCM API integration
- [ ] Token lifecycle handling (suspended/revoked access)
- [ ] TCT Owner vs TCT Participant distinction enforced in UI

### Phase D — TCNWFT Smart Contract Layer (target: June 30, 2026 for foundational contracts)
- [ ] EntityFormationMessage contract
- [ ] FundMovementMessage contract
- [ ] Fund transfer acknowledgment sequencing design
- [ ] TCNWorkflow1155 core contract (July 2026)
- [ ] TCNWorkflowRegistry (July 2026)
- [ ] TCT integration (ITCTAuthorization, Minting Order, SDN Kill Switch)
- [ ] Event pipeline and TCT sync service
- [ ] Reporting dashboard v1
- [ ] Independent smart-contract audit

---

## 12. Important Constraints

- **No developer on team** — Claude Code is the primary development tool
- **Solo operator** — Keep architecture as simple as possible
- **Learn as we build** — Prioritize understandable code over clever code
- **TCNWFT deferred** — Smart contract layer not in current scope; architecture must be designed to accommodate it later
- **Compliance-first** — When in doubt, add more logging and more access restrictions
- **Budget awareness** — TCNWFT full build estimated $340,000–$560,000; Phase A MVP should be as lean as possible

---

## 13. Glossary

| Term | Meaning |
|------|---------|
| TCT | TokenCap Token — the credential issued by TCM |
| TCM | TokenCap Miner — the credentialing entity |
| TCN | TokenCap Network — the collaboration platform (what we're building) |
| TCA | TokenCap Advisors — the analytics/advisory entity |
| TCNWFT | TCN Workflow Token — ERC-1155 utility token for workflow execution tracking; deferred |
| TCT Owner | Holds active TCT; can browse listings |
| TCT Participant | TCT Owner who has elected to participate AND whose fund transfer is acknowledged |
| 2678 | 2678 Holdings LLC — the parent ecosystem |
| Listing | A project collaboration opportunity posted by a submitter |
| Participant | A verified TCT holder with platform access |
| Submitter | An external party who posts a listing |
| Signal | A participant's expression of interest in a listing |
| Audit Log | Immutable record of all platform events |
| SDN Kill Switch | Emergency mechanism to deactivate a participant sanctioned by OFAC |
| Minting Order | Authorization to mint TCNWFT tokens following fund transfer acknowledgment |
| FundMovementMessage | Smart contract that surfaces (does not execute) fund transfer acknowledgment |
| EntityFormationMessage | Smart contract that surfaces off-chain legal entity formation confirmation |
| Reporter-not-determiner | Core design rule: contracts surface facts, never calculate economic outcomes |
