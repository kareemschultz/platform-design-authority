# Platform Design Authority

> The authoritative blueprint for a modular, intelligent, white-label Business Operating Platform.

## Purpose

This repository defines the platform before implementation. It is the source of truth for product strategy, architecture, business capabilities, user experience, artificial intelligence, security, data, licensing, deployment, engineering standards, testing, operations, and roadmap decisions.

Human contributors and AI coding agents must consult the approved specifications in this repository before implementing platform behavior. Draft documents support research and prototypes but do not become implementation authority merely because they exist.

## Vision

Build one unified platform that can run organizations across industries without forcing every customer to purchase, see, or use every capability.

The platform supports:

- Modular business domains and feature-level entitlements
- Role-based workspaces that reduce complexity
- Retail, commerce, POS, inventory, warehouse, finance, CRM, workforce, payroll, manufacturing, projects, assets, service, and future domains
- Industry and jurisdiction packs assembled from reusable capabilities rather than forked products
- Direct SaaS, self-hosted, hybrid, edge, and offline-capable deployments
- First-class white-labeling for customers, resellers, and platform partners
- A marketplace for extensions, integrations, templates, workflows, themes, reports, and AI skills
- AI assistance that is permission-aware, explainable, auditable, and approval-controlled

## Authority Model

The hierarchy of authority is:

1. Ratified Constitution
2. Approved Architecture Decision Records
3. Approved domain, engine, UX, data, security, commercial, and roadmap specifications
4. Implementation and operational documentation
5. Source code

When implementation conflicts with an approved specification, the specification governs until formally amended. Conflicts between governing documents must be reported and dispositioned, never resolved silently.

## Repository Structure

```text
00-Foundation/          Canon, constitution, principles, glossary, decision framework
01-Platform/            Platform kernel and shared services
02-Architecture/        System, domain, API, event, data, and integration architecture
03-Business-Engines/    Reusable business engines
04-Business-Domains/    Commerce, inventory, finance, workforce, CRM, and operations
05-Industry-Packs/      Industry and jurisdiction configurations without code forks
06-AI/                  AI architecture, governance, agents, safety, and evaluation
07-Developer-Platform/  APIs, SDKs, applications, webhooks, CLI, and extension framework
08-Marketplace/         Publishing, review, installation, billing, and partner ecosystem
09-UX/                  Design system, navigation, workspaces, accessibility, and branding
10-Data/                Data ownership, classification, analytics, search, and migration
11-Security/            Tenant isolation, privacy, risk, identity, and threat controls
12-Deployment/          SaaS, self-hosted, hybrid, edge, backup, restore, and recovery
13-Commercial/          Packaging, entitlements, metering, billing, pricing, and partners
14-Engineering/         Coding, review, versioning, dependency, and documentation standards
15-Operations/          Observability, support, incident response, SRE, and administration
16-Testing/             Test strategy, quality gates, environments, and release validation
17-Roadmap/             First-slice scope, delivery phases, ratification, and milestones
18-Decisions/           Architecture Decision Records
19-Appendices/          Dated evidence and supporting research
20-Strategy/            Founder decisions, market, company, and long-term strategy
registry/               Machine-readable domains, documents, capabilities, events, scope
scripts/                Deterministic governance validators and registry generators
reviews/                Independent audits and formal dispositions
templates/              Standard authoring and review templates
.github/workflows/       Automated documentation governance
CLAUDE.md               AI-agent operating contract
```

## Start Here

- `PLATFORM_MANIFEST.md` — current structural definition
- `00-Foundation/PLATFORM_CANON.md` — product philosophy
- `00-Foundation/CONSTITUTION.md` — supreme platform rules
- `00-Foundation/GLOSSARY.md` — canonical terminology
- `01-Platform/PLATFORM_KERNEL_OVERVIEW.md` — kernel charter
- `04-Business-Domains/BUSINESS_CAPABILITY_MAP.md` — capability index
- `17-Roadmap/FIRST_SLICE_MANIFEST.md` — bounded first vertical slice
- `20-Strategy/FOUNDER_DECISION_REGISTER.md` — decisions architecture cannot infer
- `CLAUDE.md` — agent instructions
- `reviews/FABLE5_SECOND_AUDIT_V1.md` — latest independent audit

## Machine-Readable Governance

Generated and governed registries include:

- `registry/domains.json`
- `registry/documents.json`
- `registry/capabilities.json`
- `registry/events.json`
- `registry/first-slice.json`

Run locally:

```bash
python scripts/validate_docs.py
python scripts/generate_registries.py --check
```

Regenerate after changing governed documents:

```bash
python scripts/generate_registries.py
```

CI fails when front matter, document IDs, namespaces, event identifiers, internal links, JSON, or committed registries are invalid or stale.

## Document Lifecycle

Every authoritative document uses:

`Draft → In Review → Approved → Ratified → Deprecated or Superseded`

AI coding agents may use Draft documents for exploration and prototypes. Production implementation must be based on Approved or Ratified material unless explicitly authorized through a reviewed exception.

## Core Platform Rules

Every platform capability must be:

- Modular and entitlement-aware
- Permission-aware and least-privilege by default
- Tenant-isolated
- Auditable and observable
- API-accessible and event-capable
- Mobile-responsive and accessible
- Internationalization- and jurisdiction-ready
- Configurable before requiring customization
- Testable, documented, and recoverable
- Explicit about offline behavior
- Compatible with white-label and partner architecture
- Classified for privacy, export, search, and AI use

## Current Status

The repository is in **Blueprint Draft and Technical Prototype Readiness**.

Two independent Fable 5 audits have been completed. The first remediation wave is materially closed. The second audit identified propagation, stored-value, privacy-erasure, payment-operating-model, event-governance, jurisdiction, security, testing, and recovery gaps. These are being remediated before first-slice specifications enter formal review.

The current readiness decision remains: **controlled technical prototypes only**.

## Working Agreement

No feature moves directly from an idea to code:

`Idea → Research → Capability Proposal → Blueprint Specification → Independent Review → Decision → Implementation → Verification → Measurement → Documentation`

## Ownership

Platform Founder: Kareem Schultz  
Repository: `kareemschultz/platform-design-authority`