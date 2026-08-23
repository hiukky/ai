---
description: Record an Architecture Decision Record ad hoc, using the `adr` skill - for a decision made outside an in-flight OpenSpec change, or to backfill one that predates this convention.
---

# /openspec:adr

Use the `adr` skill to record one Architecture Decision Record under
`docs/adr/`, independent of any OpenSpec change.

Treat the argument after `/openspec:adr` as a short description of the
decision to record - or, if empty, let the skill ask what decision to
record. It doesn't replace the skill's own checks (whether the decision
actually clears the ADR bar, gathering real context rather than a
tidied-up retelling, numbering, superseding an existing ADR correctly).
