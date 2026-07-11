---
document_id: PDA-DOM-010
title: Supply Chain and Logistics Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Supply Chain and Logistics Domain

## Purpose

Own shipment planning, transportation, carrier coordination, delivery execution, freight visibility, network planning, and logistics performance across inbound, outbound, and transfer flows.

## Core Capabilities

- Shipment creation, consolidation, splitting, routing, and status
- Carrier, service level, rate, and contract management
- Freight quotation, booking, tendering, tracking, and proof of delivery
- Delivery routes, stops, dispatch, driver assignment, and exception handling
- Inbound, outbound, intercompany, and inter-warehouse logistics
- Parcel, less-than-truckload, full truckload, courier, air, ocean, and rail hooks
- Freight cost allocation, landed cost inputs, claims, and accessorials
- Customs, trade documents, export controls, and broker integration hooks
- Network, lane, lead-time, capacity, and logistics KPI analysis

## Authoritative Entities

Shipment, Shipment Leg, Route, Stop, Carrier Contract, Freight Quote, Dispatch, Delivery, Proof of Delivery, Freight Claim, and Logistics Exception.

## Boundaries

Warehouse owns pick, pack, stage, and load execution. Inventory owns stock movements and in-transit balances. Procurement and Commerce own demand. Finance owns settlement and accounting. Supply Chain coordinates transportation and network movement.

## Quality Requirements

- Idempotent carrier interactions
- Status reconciliation across providers
- Mobile and offline delivery execution
- Geolocation privacy and retention controls
- Cost, currency, and dimensional-weight precision
- Exception, claim, and proof-of-delivery audit
