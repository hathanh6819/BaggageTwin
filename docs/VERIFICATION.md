# Verification evidence

## Local commands and result

Run from the repository root:

```powershell
python -m pytest tests -q
python -X utf8 -m genvm_linter.cli contracts/baggage_twin.py
```

Verified on 2026-10-05:

```text
19 passed
GenVM lint: passed (3 checks)
```

This is reproducible local evidence using a mocked GenLayer runtime. It is complemented by the finalized [Studio Next E2E record](LIVE_EVIDENCE.md).

## Covered behavior

- permissionless case creation without constructor roles;
- invalid reference rejection;
- ordered two-wallet pairing and distinct-wallet enforcement;
- reveal forbidden before both commitments;
- actor enforcement and immutable failure paths;
- commitment mismatch and cross-case binding;
- complete two-party reveal path;
- validator-backed happy match;
- insufficient, conflicting, ambiguous, malformed, and unknown results fail safely;
- prompt injection treated as inert evidence;
- stale revision rejection without mutation;
- custodian-only release issuance and consumption;
- wrong-ticket rejection and replay prevention;
- pre-pair cancellation and post-pair cancellation rejection;
- assessment history binds both reveal digests;
- terminal plaintext fields are cleared;
- required GenLayer header and architecture guards.

## Live evidence checklist

The deployed run now includes explorer links for all of the following without replacing local tests:

1. deployment from a deployer-only wallet;
2. happy path using two different operational wallets;
3. conflict or ambiguous assessment;
4. wrong reveal or stale-revision failure demonstrating no mutation;
5. wrong-ticket failure and successful ticket consumption;
6. replay attempt after consumption;
7. readbacks of the case and assessment matching transaction outcomes.

The deployment address and network are recorded in `deployment.json`. Every transaction reference in live-evidence documentation is a clickable explorer URL, not a bare hash.
