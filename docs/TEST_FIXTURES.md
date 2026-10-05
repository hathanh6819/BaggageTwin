# Reproducible test fixtures

These are synthetic descriptions with no personal data. Replace `case_id` in commitment calculations with the actual returned ID.

## Happy-path pair

Custodian description:

```text
Medium navy hard-shell spinner suitcase with a silver zipper, a broken rear-left wheel, and a yellow triangle sticker beside the handle.
```

Claimant description:

```text
Dark navy medium polycarbonate roller suitcase with four wheels. The rear-left wheel is cracked and a yellow triangular sticker sits beside the handle.
```

Suggested salts:

```text
custodian-salt-2026
claimant-salt-2026
```

Expected semantic result: the validator may return `MATCH`; the deterministic gate still requires distinctive overlap, at least three matched categories, and no conflicts before the case becomes `MATCH_READY`.

## Conflict pair

Use the happy-path custodian description and this claimant description:

```text
Large red fabric duffel bag with a black shoulder strap, soft sides, and no wheels.
```

Expected safe result: `NO_MATCH` because material, form, color, and size conflict.

## Ambiguous pair

Use the happy-path custodian description and this claimant description:

```text
A medium blue rolling suitcase with four wheels and no distinctive marks or accessories.
```

Expected safe result: `AMBIGUOUS` unless validator evidence satisfies every positive-gate requirement. Generic similarity alone must not authorize release.

## Failure checks

- Reveal with a different salt: `COMMITMENT_MISMATCH`, no state mutation.
- Claim from the custodian wallet: `DISTINCT_CLAIMANT_REQUIRED`.
- Submit an outdated revision: `STALE_REVISION`, no state mutation.
- Consume with a different ticket: `TICKET_MISMATCH`, no state mutation.
- Consume the valid ticket a second time: `RELEASE_NOT_AVAILABLE`.

