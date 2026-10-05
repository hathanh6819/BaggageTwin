# Threat model

## Protected decisions

The protected decision is issuance and one-time consumption of a baggage release authorization signal. The contract does not custody property and cannot prove legal ownership.

## Attacks and controls

| Threat | Control |
|---|---|
| One party adapts its description after seeing the other | Both parties commit before either may reveal |
| Commitment copied into another case or role | Domain separation binds case ID and exact role |
| Custodian impersonates claimant | Claimant wallet must differ from custodian |
| Generic descriptions produce false positive | Distinctive overlap plus at least three matched categories required |
| Contradictory descriptions pass | Any bounded conflict prevents positive result |
| Model emits malformed or invented fields | Exact schema and bounded enum checks; fail closed |
| Prompt injection inside a description | Text is labeled inert evidence; output is schema-validated and deterministically gated |
| Stale UI submits an old action | Expected-revision check on every transition |
| Outsider issues or consumes ticket | Case-scoped custodian authorization |
| Ticket is reused | Terminal `RELEASED` state and `release_consumed` flag |
| Ticket is moved across a case or assessment | Digest binds case, assessment, both actors, bag reference, and both reveal digests |
| Failed consensus destroys progress | Audited `CONSENSUS_UNRESOLVED` state permits reassessment |
| False privacy claim | Protocol metadata says `privacy: false`; docs warn that chain data is public |

## Residual risks

- Two colluding wallets can coordinate descriptions.
- A distinctive description can still coincide across similar bags.
- Validator interpretation can be incorrect despite consensus.
- Salts revealed on-chain do not provide post-reveal secrecy.
- Physical staff must still compare the actual bag and follow applicable policy.

