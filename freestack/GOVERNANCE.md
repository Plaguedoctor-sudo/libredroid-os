# Governance

## Purpose

Keep FreeStack free. Every rule here exists to stop one specific failure:
re-enclosure by a single company, or a fork that takes the name and closes
the source.

## Legal form

FreeStack is held by the **FreeStack Foundation**, a non-profit. Until it is
incorporated, it is fiscally hosted (SPI or KDE e.V. model). The Foundation
holds the trademark, the domain, the signing infrastructure and the mirrors.
It holds no copyright.

## Copyright and licensing

- Contributors keep their copyright.
- Inbound: **DCO 1.1 sign-off**. No CLA. A contributor can never be asked to
  assign rights or grant relicensing.
- Outbound: platform `GPL-3.0-or-later`; services `AGPL-3.0-or-later`; docs and
  spec `CC BY-SA 4.0`; data files `CC0-1.0`.
- Every file carries an SPDX identifier. `reuse lint` is a merge gate.

## License change bar

Any change to the outbound license needs:

1. ≥2/3 of all contributors by commit count, and
2. a public 30-day comment period, and
3. it may never move to a non-free license.

## Technical steering

- 7 seats, 2-year staggered terms.
- No single employer may hold more than 1/3 of seats.
- Decisions by rough consensus; a 2/3 vote breaks deadlock.
- All meetings minuted and published within 7 days.

## Trademark

- "FreeStack" and the logo are Foundation trademarks.
- A fork may use the name if it passes `core` conformance and publishes its
  rebuild hashes. Losing conformance means dropping the mark, not the code.
- Commercial use of the mark needs no permission and no payment.

## Open core ban

A feature shipped in the free edition may never be moved to a paid edition.
If a company offers hosting, the server must be the same AGPL code that is
in the repo.

## Signing

- Root keys are 3-of-5, held by 5 people in ≥3 organisations.
- No single holder can ship a release.
- Key rotation: 24 months, or immediately on any suspected compromise.
- Every signature is logged to the public transparency log.

## Conformance

Self-certification is free. `core` conformance is the only requirement to use
the mark. Third-party audit is optional and never a paywall.

## Forking

Explicitly blessed. Fork, rename if you like, keep the license. The Foundation
will list known forks in `docs/FORKS.md`.

## Dissolution

If the Foundation dissolves, assets go to a successor non-profit with the same
license policy. If none exists, the trademark enters the public domain.
