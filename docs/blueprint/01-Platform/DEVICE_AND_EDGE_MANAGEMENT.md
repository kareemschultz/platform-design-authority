---
document_id: PDA-PLT-016
title: Device and Edge Management
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Device and Edge Management

## Purpose

Define how the platform enrolls, identifies, configures, secures, monitors, and retires devices and edge nodes used by stores, warehouses, field teams, kiosks, and self-hosted locations.

## Managed Device Types

- POS terminals and registers
- Tablets and mobile devices
- Warehouse handhelds and scanners
- Kiosks and customer-facing displays
- Receipt printers, label printers, scales, and payment peripherals
- Biometric and attendance devices
- Edge servers and store gateways
- IoT sensors and approved operational devices

## Core Capabilities

- Enrollment and ownership assignment
- Device identity and certificates
- Tenant, branch, location, and workspace binding
- Configuration profiles
- Application and firmware version inventory
- Health, connectivity, storage, battery, and clock status
- Remote lock, revoke, wipe, or decommission where supported
- Peripheral registration and capability discovery
- Signed commands and secure update channels
- Offline entitlement leases and policy caching

## Rules

1. Devices must have unique identities separate from human users.
2. Shared terminals must still attribute consequential actions to the active operator.
3. Device credentials must be revocable, rotatable, and hardware-protected where possible.
4. Edge nodes must not become uncontrolled authoritative sources outside approved offline rules.
5. Remote commands require authentication, authorization, audit, replay protection, and expiry.
6. Device configuration must inherit through governed scope and allow controlled local overrides.
7. Unsupported or compromised versions may be quarantined or restricted.
8. Payment and biometric devices require stricter security and compliance boundaries.

## Lifecycle States

- Pending enrollment
- Active
- Offline
- Degraded
- Quarantined
- Lost or stolen
- Revoked
- Retired

## Events

- `platform.device.enrolled.v1`
- `platform.device.configuration-changed.v1`
- `platform.device.quarantined.v1`
- `platform.device.revoked.v1`
- `platform.edge-node.sync-failed.v1`

## Quality Gates

- Enrollment and certificate tests
- Tenant and location reassignment tests
- Lost-device and revocation drills
- Clock-drift and connectivity tests
- Signed-update verification
- Peripheral compatibility tests
