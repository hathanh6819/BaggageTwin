# Live Studio Next E2E evidence

Verified on 2026-10-05 against the deployed contract:

- Contract: [`0x919103E93f95690858313724129b58Ed38a70ffa`](https://explorer-studio-dev.genlayer.com/address/0x919103E93f95690858313724129b58Ed38a70ffa)
- Network: GenLayer Studio Next, chain ID `61997`
- Custodian test wallet: `0x1D283b45974B0be9630DFD1deC6A62a9B72B2760`
- Claimant test wallet: `0xf96Cf822F9f4e76956AB9fAAa22B3BdCD7b10aD6`
- Initial readback: protocol `BaggageTwin` v1; `constructor_roles=false`; counts `0 cases / 0 assessments`
- Final readback: `2 cases / 2 assessments`

Every listed write reached `FINISHED_WITH_RETURN / MAJORITY_AGREE`. Failure-path evidence includes complete post-transaction readback showing that prohibited state changes did not occur.

## Case 1 — happy path and adversarial controls

| Action | Explorer evidence | Authoritative readback |
|---|---|---|
| Open case | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x788e992e88c005a3d98efca115099d3d9720a58bd042e8b5a71deacd30e487ea) | Case 1 `OPEN`, revision 1; custodian equals test wallet A |
| Custodian commits | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x7a9faa9d3075d0732e205b75974ef7f2468c06557fbb58266db7f28f17c4309a) | `CUSTODIAN_COMMITTED`, revision 2 |
| Same wallet attempts claimant role | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0xc0a46073e048eb8def4ad329c2b65fd70ace6c0ae7116c370ce405ad3326d124) | Rejected; claimant stayed empty and full case remained at revision 2 |
| Independent claimant commits | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x06fe15c325ed04e36372d4197708bc2348cb1a340b51c212a1fbbbcfbf4a398d) | `BOTH_COMMITTED`, revision 3; wallet B bound as claimant |
| Custodian reveals with wrong salt | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x9ae52618ac5aa1e6cdae56250ffe46a5d47cd493cc3c625de0cc2e1a10f2b1e4) | Rejected; status, revision, descriptions and counters unchanged |
| Custodian valid reveal | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x4fc64c23e7e0cbe8aae5dcfa1d8c8696e04ff2d7fe66c31111346b39cbc30463) | `CUSTODIAN_REVEALED`, revision 4 |
| Claimant valid reveal | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x8d546efec638cf75590f79e8acf92cb599f0cab6e4092568dd6937db8d2f90c3) | `BOTH_REVEALED`, revision 5 |
| Permissionless assessment | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x20f88bb54fc3feb33928de5e9a3560a042c260e6fc690f2ab2825562ec801ac7) | Assessment 1: `MATCH / MATCH_READY`; matched `COLOR`, `DAMAGE_MARK`, `FORM`, `MATERIAL`, `SIZE`; distinctive overlap true; no conflicts |
| Claimant attempts to issue release | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x3e259259ea103005682a4c16d14b418ae8e2f29f49ef75f4ceca6130929251ca) | Rejected; case stayed `MATCH_READY`, revision 6; ticket remained empty |
| Custodian issues bound ticket | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x7f310671da6da26b84a9e160eccaa9dd2c1eabc24d4699924e92704827f41050) | `RELEASE_AUTHORIZED`, revision 7; ticket digest stored |
| Custodian submits wrong ticket | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0xbc3eaa0d077cea1b41ffcdfa24f04b918782d6016a6ab6f5f1ade5d9f8e72032) | Rejected; authorization, revision, stored ticket and consumption flag unchanged |
| Consume exact ticket | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x6cb360e655b05fb994203e1f3724fd71d6c0000759bf888ae1921739e13e5f67) | `RELEASED`, revision 8, consumed true; current plaintext descriptions cleared |
| Replay consumed ticket | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x28b9e01b7334b8bbefd7eaecb8725bbc4894f2d2d02150c124f5e9b2be60c4d9) | Rejected; complete terminal case readback unchanged |

The positive assessment is bound to both independently created reveal digests. The release ticket is derived from the case, assessment, both wallets, reference digest, and both reveal digests.

## Case 2 — conflicting descriptions

| Action | Explorer evidence | Authoritative readback |
|---|---|---|
| Open conflict case | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x81d00d5bb7aa7f29ef0194f30182d27e9c0ccdaad56a3b6867a57701d4c802e3) | Case 2 `OPEN` |
| Custodian commits | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0xc1c043e14185192ee7fe02305ae5c221c14c8c5f18edd09bdbe6edd9064574b9) | Custodian commitment bound to case 2 |
| Claimant commits | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0xe0f1c92d676c6ec96d18dc8832affabf32efb3d179f55532675eb5421795c91f) | Independent claimant bound |
| Custodian reveals | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0x775e1831ba1bba5d0e5c151c6b3501824819c4088bb859ec9e9f35be4ba9be99) | Commitment opened correctly |
| Claimant reveals conflicting bag | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0xc791243b269b8962d5ae98d2e2a4a2f3fb9c98982e9daad4b116b0e0832c9e0a) | Both descriptions revealed |
| Assess conflict | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0xe254c39710848d9de3958c08f410091b4cd048b72490a84f8fa64912c67fdd89) | Assessment 2: `NO_MATCH`; conflicts `COLOR`, `FORM`, `MATERIAL`, `SIZE`; no ticket |
| Attempt release from `NO_MATCH` | [Transaction](https://explorer-studio-dev.genlayer.com/transactions/0xbae732baea8f80e0b1bf0c60935b6e25afb88789053bc65698a9a1ee8d90813c) | Rejected; complete case remained `NO_MATCH`, revision 6, ticket empty |

## What this evidence proves

- The deployer is not used as an operational test role.
- Two distinct wallets execute the reciprocal commit/reveal protocol.
- Validator consensus supplies bounded semantic findings; deterministic code controls authorization.
- Wrong actor, wrong salt, wrong ticket, replay, and conflict paths do not create a release capability.
- Transaction results and finalized contract readbacks agree.

## Honest limits

The fixtures are synthetic and establish protocol behavior, not legal ownership of physical baggage. On-chain descriptions are public. Clearing current plaintext after release does not erase historical blockchain data.
