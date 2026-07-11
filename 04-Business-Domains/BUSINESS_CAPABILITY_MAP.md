---
document_id: PDA-DOM-021
title: Business Capability Map
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Business Capability Map

## Purpose

This document is the master index of business and platform capabilities. It defines the canonical hierarchy used for planning, packaging, entitlements, permissions, implementation, documentation, testing, AI tooling, and industry composition.

## Capability Model

Each capability must eventually define:

- Canonical identifier
- Owning domain or engine
- Purpose and users
- Maturity level
- Entitlement and packaging model
- Permissions and scopes
- Dependencies
- APIs, commands, and events
- Data ownership
- UX, mobile, and offline behavior
- Reports, automation, and AI support
- Security, audit, and compliance requirements
- Testing and operational readiness

## Platform Capabilities

### Platform Kernel

- `platform.tenancy`
- `platform.organizations`
- `platform.identity`
- `platform.authentication`
- `platform.authorization`
- `platform.delegation`
- `platform.entitlements`
- `platform.usage-metering`
- `platform.configuration`
- `platform.audit`
- `platform.events`
- `platform.jobs`
- `platform.notifications`
- `platform.files`
- `platform.search`
- `platform.localization`
- `platform.reference-data`
- `platform.feature-flags`
- `platform.devices`
- `platform.offline-sync`
- `platform.secrets`
- `platform.administration`

### Shared Engines

- `engine.workflow`
- `engine.approvals`
- `engine.rules`
- `engine.automation`
- `engine.pricing`
- `engine.tax`
- `engine.payments`
- `engine.promotions`
- `engine.documents`
- `engine.scheduling`
- `engine.branding`
- `engine.workspaces`
- `engine.dashboards`
- `engine.reporting`

## Business Domains

### Commerce

- `commerce.pos`
- `commerce.register-management`
- `commerce.shift-management`
- `commerce.cash-management`
- `commerce.quotes`
- `commerce.sales-orders`
- `commerce.order-management`
- `commerce.returns`
- `commerce.exchanges`
- `commerce.refunds`
- `commerce.receipts`
- `commerce.gift-receipts`
- `commerce.store-credit`
- `commerce.gift-cards`
- `commerce.layaway`
- `commerce.deposits`
- `commerce.ecommerce`
- `commerce.checkout`
- `commerce.omnichannel-orders`
- `commerce.channel-management`
- `commerce.customer-account-sales`
- `commerce.offline-sales`
- `commerce.self-checkout`
- `commerce.assisted-selling`
- `commerce.mobile-pos`

### Product Catalog

- `catalog.products`
- `catalog.services`
- `catalog.variants`
- `catalog.attributes`
- `catalog.categories`
- `catalog.collections`
- `catalog.brands`
- `catalog.identifiers`
- `catalog.barcodes`
- `catalog.packaging`
- `catalog.bundles`
- `catalog.kits`
- `catalog.media`
- `catalog.localization`
- `catalog.assortments`
- `catalog.channel-publication`
- `catalog.lifecycle`
- `catalog.bulk-import`

### Inventory

- `inventory.stock-ledger`
- `inventory.stock-balances`
- `inventory.availability`
- `inventory.reservations`
- `inventory.adjustments`
- `inventory.transfers`
- `inventory.counts`
- `inventory.cycle-counts`
- `inventory.lot-tracking`
- `inventory.serial-tracking`
- `inventory.expiry-tracking`
- `inventory.statuses`
- `inventory.consignment`
- `inventory.quarantine`
- `inventory.replenishment`
- `inventory.safety-stock`
- `inventory.valuation-inputs`
- `inventory.aging`
- `inventory.traceability`
- `inventory.offline-movements`

### Warehouse

- `warehouse.topology`
- `warehouse.bins`
- `warehouse.receiving`
- `warehouse.inspection`
- `warehouse.putaway`
- `warehouse.replenishment-tasks`
- `warehouse.picking`
- `warehouse.wave-picking`
- `warehouse.batch-picking`
- `warehouse.zone-picking`
- `warehouse.cluster-picking`
- `warehouse.packing`
- `warehouse.cartons`
- `warehouse.labels`
- `warehouse.staging`
- `warehouse.loading`
- `warehouse.cross-docking`
- `warehouse.kitting`
- `warehouse.value-added-services`
- `warehouse.task-management`
- `warehouse.labor-tracking`
- `warehouse.mobile-execution`

### Procurement

- `procurement.suppliers`
- `procurement.supplier-catalogs`
- `procurement.requisitions`
- `procurement.rfq`
- `procurement.sourcing-events`
- `procurement.bids`
- `procurement.purchase-orders`
- `procurement.blanket-orders`
- `procurement.change-orders`
- `procurement.receipt-expectations`
- `procurement.tolerances`
- `procurement.supplier-returns`
- `procurement.claims`
- `procurement.contract-compliance`
- `procurement.supplier-scorecards`
- `procurement.spend-analysis`
- `procurement.landed-cost-inputs`

### Finance

- `finance.chart-of-accounts`
- `finance.general-ledger`
- `finance.journals`
- `finance.accounting-periods`
- `finance.dimensions`
- `finance.posting-rules`
- `finance.accounts-receivable`
- `finance.accounts-payable`
- `finance.billing`
- `finance.credit-notes`
- `finance.collections`
- `finance.payment-runs`
- `finance.bank-accounts`
- `finance.bank-feeds`
- `finance.bank-reconciliation`
- `finance.cash-management`
- `finance.expenses`
- `finance.reimbursements`
- `finance.fixed-assets`
- `finance.depreciation`
- `finance.budgets`
- `finance.allocations`
- `finance.consolidation`
- `finance.intercompany`
- `finance.close-management`
- `finance.financial-reporting`

### CRM

- `crm.accounts`
- `crm.contacts`
- `crm.prospects`
- `crm.leads`
- `crm.opportunities`
- `crm.pipelines`
- `crm.activities`
- `crm.tasks`
- `crm.territories`
- `crm.assignment`
- `crm.customer-360`
- `crm.segments`
- `crm.consent`
- `crm.sales-forecasting`
- `crm.relationship-history`

### Workforce

- `workforce.employees`
- `workforce.contractors`
- `workforce.positions`
- `workforce.jobs`
- `workforce.departments`
- `workforce.assignments`
- `workforce.recruitment`
- `workforce.applicants`
- `workforce.interviews`
- `workforce.offers`
- `workforce.onboarding`
- `workforce.offboarding`
- `workforce.time`
- `workforce.attendance`
- `workforce.shifts`
- `workforce.leave`
- `workforce.accruals`
- `workforce.performance`
- `workforce.learning`
- `workforce.skills`
- `workforce.certifications`
- `workforce.employee-relations`
- `workforce.self-service`
- `workforce.manager-self-service`

### Payroll

- `payroll.pay-groups`
- `payroll.calendars`
- `payroll.periods`
- `payroll.earnings`
- `payroll.deductions`
- `payroll.benefits`
- `payroll.garnishments`
- `payroll.tax-withholding`
- `payroll.employer-liabilities`
- `payroll.time-import`
- `payroll.calculation`
- `payroll.preview`
- `payroll.variance-analysis`
- `payroll.approval`
- `payroll.finalization`
- `payroll.reversal`
- `payroll.off-cycle`
- `payroll.termination-pay`
- `payroll.payment-files`
- `payroll.payslips`
- `payroll.filings`
- `payroll.year-end`
- `payroll.costing`
- `payroll.reconciliation`

### Supply Chain and Logistics

- `logistics.shipments`
- `logistics.carriers`
- `logistics.rates`
- `logistics.booking`
- `logistics.tendering`
- `logistics.tracking`
- `logistics.dispatch`
- `logistics.routes`
- `logistics.stops`
- `logistics.proof-of-delivery`
- `logistics.freight-costs`
- `logistics.claims`
- `logistics.customs`
- `logistics.trade-documents`
- `logistics.network-planning`

### Manufacturing

- `manufacturing.bills-of-material`
- `manufacturing.formulas`
- `manufacturing.recipes`
- `manufacturing.routings`
- `manufacturing.work-centers`
- `manufacturing.production-orders`
- `manufacturing.operations`
- `manufacturing.material-requirements`
- `manufacturing.scheduling`
- `manufacturing.material-consumption`
- `manufacturing.production-output`
- `manufacturing.scrap`
- `manufacturing.rework`
- `manufacturing.quality`
- `manufacturing.nonconformance`
- `manufacturing.subcontracting`
- `manufacturing.genealogy`
- `manufacturing.costing-inputs`

### Projects

- `projects.projects`
- `projects.programs`
- `projects.portfolios`
- `projects.phases`
- `projects.milestones`
- `projects.tasks`
- `projects.dependencies`
- `projects.assignments`
- `projects.resource-planning`
- `projects.time-capture`
- `projects.expense-capture`
- `projects.budgets`
- `projects.forecasts`
- `projects.billing-inputs`
- `projects.risks`
- `projects.issues`
- `projects.change-requests`
- `projects.deliverables`
- `projects.acceptance`

### Service and Help Desk

- `service.cases`
- `service.requests`
- `service.incidents`
- `service.problems`
- `service.queues`
- `service.routing`
- `service.sla`
- `service.omnichannel-intake`
- `service.knowledge-suggestions`
- `service.field-work-orders`
- `service.dispatch`
- `service.appointments`
- `service.warranties`
- `service.contracts`
- `service.entitlements`
- `service.satisfaction`

### Assets and Maintenance

- `assets.registry`
- `assets.hierarchy`
- `assets.assignment`
- `assets.condition`
- `assets.meters`
- `maintenance.plans`
- `maintenance.preventive`
- `maintenance.predictive`
- `maintenance.corrective`
- `maintenance.work-orders`
- `maintenance.inspections`
- `maintenance.calibration`
- `maintenance.failures`
- `maintenance.downtime`
- `maintenance.warranties`
- `maintenance.compliance`

### Fleet

- `fleet.vehicles`
- `fleet.assignments`
- `fleet.driver-eligibility`
- `fleet.inspections`
- `fleet.fuel`
- `fleet.charging`
- `fleet.telematics`
- `fleet.geofences`
- `fleet.compliance`
- `fleet.incidents`
- `fleet.claims`
- `fleet.utilization`
- `fleet.replacement-planning`

### Rental

- `rental.catalog`
- `rental.availability`
- `rental.reservations`
- `rental.quotes`
- `rental.agreements`
- `rental.deposits`
- `rental.checkout`
- `rental.delivery`
- `rental.collection`
- `rental.return`
- `rental.inspection`
- `rental.usage-charges`
- `rental.damage`
- `rental.overdue`
- `rental.utilization`

### Marketing

- `marketing.audiences`
- `marketing.segments`
- `marketing.campaigns`
- `marketing.journeys`
- `marketing.content`
- `marketing.forms`
- `marketing.landing-pages`
- `marketing.offers`
- `marketing.referrals`
- `marketing.experiments`
- `marketing.attribution`
- `marketing.lead-nurturing`
- `marketing.lifecycle`

### Documents and Knowledge

- `knowledge.documents`
- `knowledge.articles`
- `knowledge.policies`
- `knowledge.procedures`
- `knowledge.versioning`
- `knowledge.review`
- `knowledge.publication`
- `knowledge.acknowledgements`
- `knowledge.retention`
- `knowledge.legal-hold`
- `knowledge.external-sharing`
- `knowledge.ai-assistance`

### Governance and Compliance

- `governance.obligations`
- `governance.controls`
- `governance.risks`
- `governance.assessments`
- `governance.audits`
- `governance.findings`
- `governance.incidents`
- `governance.corrective-actions`
- `governance.exceptions`
- `governance.evidence`
- `governance.attestations`
- `governance.third-party-risk`

### Planning and Analytics

- `planning.strategic-plans`
- `planning.objectives`
- `planning.key-results`
- `planning.targets`
- `planning.budgets`
- `planning.forecasts`
- `planning.demand`
- `planning.workforce`
- `planning.capacity`
- `planning.scenarios`
- `planning.assumptions`
- `planning.drivers`
- `planning.variance-analysis`
- `planning.metric-certification`
- `planning.predictive-models`

## Governance

This map is intentionally broad and remains a living index. New capabilities require ownership, canonical naming, dependency review, and packaging classification before implementation.
