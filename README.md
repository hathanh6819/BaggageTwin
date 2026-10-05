# BaggageTwin

**BaggageTwin — Sealed Lost-Baggage Description Matcher** is a GenLayer Intelligent Contract for a narrow airport handover problem: two different wallets independently commit descriptions of a bag before either description is revealed. GenLayer validators then compare the revealed descriptions semantically, while deterministic contract rules decide whether a single-use release ticket may exist.

This is not an ownership oracle. It proves only that two independently committed descriptions correspond strongly enough under the documented protocol. All submitted data is public on-chain; never enter personal data or secrets.

## Why the architecture is different

BaggageTwin is a reciprocal commit/reveal protocol, not an admin registry, evidence scraper, escrow, or one-sided AI classification contract. The custodian cannot see and adapt to the claimant's description before committing, and the claimant cannot see the custodian's plaintext before committing. The AI output is advisory input to a deterministic positive gate.

## Contract lifecycle

1. Any wallet opens a case with a precomputed `sha256:` baggage-reference digest and becomes that case's custodian.
2. The custodian commits a domain-separated hash of its description and salt.
3. A different wallet commits the claimant description and becomes the claimant.
4. The custodian reveals first; the claimant reveals second. Each reveal must reproduce its commitment.
5. Anyone may call `assess_match`. Validators compare the two inert descriptions.
6. A positive result requires all of: model decision `MATCH`, a genuinely distinctive overlap, at least three bounded matching trait categories, and zero conflicting categories.
7. Only the case custodian may issue and consume the release ticket. Consumption is atomic and cannot be replayed.

## Reviewer quick path

No constructor inputs or privileged global roles are required. Use two different funded wallets.

1. Deploy `contracts/baggage_twin.py`.
2. Wallet A calls `open_case("sha256:<64 lowercase hex>")`; record returned `case_id` (normally `1`).
3. Locally compute both commitments using the exact formula below. Wallet A calls `commit_custodian(case_id, custodian_commitment, 1)`.
4. Wallet B calls `commit_claim(case_id, claimant_commitment, 2)`.
5. Wallet A calls `reveal_custodian(case_id, custodian_description, custodian_salt, 3)`.
6. Wallet B calls `reveal_claim(case_id, claimant_description, claimant_salt, 4)`.
7. Either wallet calls `assess_match(case_id, 5)` and reads `get_case(case_id)` plus `get_assessment(assessment_id)`.
8. For a `MATCH_READY` case, Wallet A calls `issue_release(case_id, 6)`, then `consume_release(case_id, ticket_digest, 7)`.

Commitment formula:

```text
sha256("BAGGAGE_TWIN_V1|" + case_id + "|" + role + "|" + normalized_description + "|" + normalized_salt)
```

`role` is exactly `CUSTODIAN` or `CLAIMANT`. Normalization trims leading/trailing whitespace and collapses internal whitespace. Prefix the lowercase hex result with `sha256:`.

Example Python helper:

```python
import hashlib

def commitment(case_id, role, description, salt):
    clean = lambda value, limit: " ".join(value.strip().split())[:limit]
    payload = f"BAGGAGE_TWIN_V1|{case_id}|{role}|{clean(description, 700)}|{clean(salt, 100)}"
    return "sha256:" + hashlib.sha256(payload.encode()).hexdigest()
```

Use the exact safe fixtures in [docs/TEST_FIXTURES.md](docs/TEST_FIXTURES.md). Reviewer outcomes and negative checks are in [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Local verification

```powershell
python -m pytest tests -q
python -X utf8 -m genvm_linter.cli contracts/baggage_twin.py
```

Current local result: **19 tests passed; GenVM lint passed (3 checks)**.

Studio Next deployment: [`0x919103E93f95690858313724129b58Ed38a70ffa`](https://explorer-studio-dev.genlayer.com/address/0x919103E93f95690858313724129b58Ed38a70ffa), chain ID `61997`. A complete finalized two-wallet run—including happy, failure, conflict, authorization, ticket mismatch, successful consumption, and replay checks—is recorded in [live E2E evidence](docs/LIVE_EVIDENCE.md).

## Repository map

- `contracts/baggage_twin.py` — the only deployable contract
- `tests/` — deterministic lifecycle and adversarial tests with a mocked GenLayer runtime
- `docs/ARCHITECTURE.md` — state machine and trust boundaries
- `docs/THREAT_MODEL.md` — abuse cases and mitigations
- `docs/TEST_FIXTURES.md` — reproducible two-wallet inputs
- `docs/VERIFICATION.md` — test matrix and reviewer assertions
- `docs/LIVE_EVIDENCE.md` — finalized Studio Next transactions and authoritative readbacks
- `deployment.json` — explicit deployment status; never a fabricated address
- `verify.ps1` — one-command local verification

## Limitations

- Semantic agreement can be wrong; it is not proof of legal ownership.
- Descriptions, salts, and transaction history are publicly observable after reveal.
- Clearing current plaintext fields after release reduces subsequent view exposure but cannot erase blockchain history.
- The contract does not hold assets or execute a physical handover. The release ticket is an auditable authorization signal only.
