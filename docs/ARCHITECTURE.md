# Architecture

## Core invariant

A release ticket can exist only when two distinct wallets committed descriptions before reveal, both commitments were opened correctly, and a validator assessment passed the contract's deterministic positive gate. The ticket is bound to the case, assessment, custodian, claimant, baggage-reference digest, and both reveal digests.

## State machine

```text
OPEN
  -> CUSTODIAN_COMMITTED
  -> BOTH_COMMITTED
  -> CUSTODIAN_REVEALED
  -> BOTH_REVEALED
       -> MATCH_READY -> RELEASE_AUTHORIZED -> RELEASED
       -> NO_MATCH
       -> AMBIGUOUS
       -> CONSENSUS_UNRESOLVED -> assess retry

OPEN or CUSTODIAN_COMMITTED -> CANCELLED
```

Every accepted transition increments `revision`. Write callers supply `expected_revision`, preventing stale interfaces or concurrent transactions from silently changing a newer case state.

## Reciprocal commitment binding

The commitment domain includes protocol version, case ID, role, normalized description, and normalized salt. A commitment therefore cannot be replayed as another role or into another case.

## Intelligence boundary

Validators interpret natural-language descriptions and return a strictly bounded structure. They cannot directly authorize release. The contract validates schema and allowed values, then applies this deterministic positive gate:

- decision is `MATCH`;
- `distinctive_overlap` is true;
- at least three categories match;
- zero categories conflict.

An invalid or non-consensual result becomes `CONSENSUS_UNRESOLVED`, is recorded, and may be retried. It never becomes permission.

## Authority model

There is no constructor role, owner, or administrator. Opening a case scopes the sender as that case's custodian. The first different wallet to submit the second commitment becomes its claimant. Only the scoped custodian can issue or consume that case's ticket.

## Data model

`cases` stores protocol state and assessment IDs. `assessments` is append-only and binds each decision to both reveal digests. Current plaintext descriptions are cleared when the release is consumed; digests and the immutable assessment remain for audit.

