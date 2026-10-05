#!/usr/bin/env node
import { createAccount, createClient } from '../../RecallRadius/frontend/node_modules/genlayer-js/dist/index.js';
import { studioDevnet } from '../../RecallRadius/frontend/node_modules/genlayer-js/dist/chains/index.js';
import { createHash } from 'node:crypto';

const CONTRACT = process.argv[2];
if (!/^0x[0-9a-fA-F]{40}$/.test(CONTRACT || '')) throw Error('Usage: node scripts/run_live_e2e.mjs <contract>');
const chain = { ...studioDevnet, id: 61997, name: 'GenLayer Studio Next', rpcUrls: { default: { http: ['https://studio-next.genlayer.com/api'] } } };

function hidden(prompt) {
  return new Promise((resolve, reject) => {
    process.stdout.write(prompt); process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding('utf8'); let value = '';
    const done = () => { process.stdin.off('data', onData); process.stdin.setRawMode(false); process.stdin.pause(); };
    const onData = chunk => { for (const ch of chunk) { if (ch === '\u0003') { done(); reject(Error('Interrupted')); return; } if (ch === '\r' || ch === '\n') { done(); process.stdout.write('\n'); resolve(value.trim()); return; } if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1); else value += ch; } };
    process.stdin.on('data', onData);
  });
}
async function signer(label) { const key = await hidden(`${label} private key (hidden): `); const account = createAccount(key.startsWith('0x') ? key : `0x${key}`); return { account, client: createClient({ chain, account }) }; }
const walletA = await signer('custodian wallet A');
const walletB = await signer('claimant wallet B');
if (walletA.account.address.toLowerCase() === walletB.account.address.toLowerCase()) throw Error('Two distinct wallets are required.');
console.log(`actors=${walletA.account.address},${walletB.account.address}`);

const read = (signer, name, args = []) => signer.client.readContract({ address: CONTRACT, functionName: name, args, stateStatus: 'finalized', jsonSafeReturn: true });
async function write(signer, label, name, args, validators = 300n) {
  const fees = await signer.client.estimateTransactionFees({ leaderTimeunitsAllocation: 300n, validatorTimeunitsAllocation: validators });
  const hash = await signer.client.writeContract({ account: signer.account, address: CONTRACT, functionName: name, args, value: 0n, fees: { distribution: fees.distribution, feeValue: fees.feeValue } });
  console.log(`${label}.submitted=${hash}`);
  const receipt = await signer.client.waitForTransactionReceipt({ hash, waitUntil: 'finalized', interval: 3000, retries: 600, fullTransaction: false });
  const tx = await signer.client.getTransaction({ hash }); const consensus = tx.result_name || tx.result || 'UNKNOWN';
  if (receipt?.txExecutionResultName && receipt.txExecutionResultName !== 'FINISHED_WITH_RETURN') throw Error(`${label} execution=${receipt.txExecutionResultName}`);
  if (!['AGREE', 'MAJORITY_AGREE'].includes(String(consensus))) throw Error(`${label} consensus=${consensus}`);
  console.log(`${label}.finalized=${hash} execution=${receipt?.txExecutionResultName || 'unknown'} consensus=${consensus}`);
  return hash;
}
const check = (ok, label, data) => { if (!ok) throw Error(`${label}: ${JSON.stringify(data)}`); console.log(`${label}.readback=${JSON.stringify(data)}`); };
const sha = value => 'sha256:' + createHash('sha256').update(value).digest('hex');
const clean = (value, limit) => value.trim().split(/\s+/).join(' ').slice(0, limit);
const commitment = (caseId, role, description, salt) => sha(`BAGGAGE_TWIN_V1|${caseId}|${role}|${clean(description, 700)}|${clean(salt, 100)}`);
const ref = label => sha(`baggage-twin-live-${label}-2026-10-05`);
const custodianText = 'Medium navy hard-shell spinner suitcase with a silver zipper, a broken rear-left wheel, and a yellow triangle sticker beside the handle.';
const claimantText = 'Dark navy medium polycarbonate roller suitcase with four wheels. The rear-left wheel is cracked and a yellow triangular sticker sits beside the handle.';
const conflictText = 'Large red fabric duffel bag with a black shoulder strap, soft sides, and no wheels.';
const saltA = 'custodian-live-salt-2026'; const saltB = 'claimant-live-salt-2026';

const protocol = await read(walletA, 'get_protocol'); const initial = await read(walletA, 'get_counts');
check(protocol.name === 'BaggageTwin' && Number(protocol.version) === 1 && protocol.constructor_roles === false, 'protocol', protocol);
check(Number(initial.cases) === 0 && Number(initial.assessments) === 0, 'clean deployment', initial);

// Case 1: full happy path plus deterministic failure paths.
await write(walletA, 'happy_open', 'open_case', [ref('happy')]); let c1 = await read(walletA, 'get_case', [1]); check(c1.status === 'OPEN' && Number(c1.revision) === 1, 'happy opened', c1);
await write(walletA, 'happy_commit_custodian', 'commit_custodian', [1, commitment(1, 'CUSTODIAN', custodianText, saltA), 1]);
await write(walletA, 'same_wallet_claim_rejected', 'commit_claim', [1, commitment(1, 'CLAIMANT', claimantText, saltB), 2]); c1 = await read(walletA, 'get_case', [1]); check(c1.status === 'CUSTODIAN_COMMITTED' && c1.claimant === '' && Number(c1.revision) === 2, 'same wallet no mutation', c1);
await write(walletB, 'happy_commit_claim', 'commit_claim', [1, commitment(1, 'CLAIMANT', claimantText, saltB), 2]);
await write(walletA, 'wrong_salt_rejected', 'reveal_custodian', [1, custodianText, 'incorrect-live-salt', 3]); c1 = await read(walletA, 'get_case', [1]); check(c1.status === 'BOTH_COMMITTED' && Number(c1.revision) === 3 && c1.custodian_description === '', 'wrong salt no mutation', c1);
await write(walletA, 'happy_reveal_custodian', 'reveal_custodian', [1, custodianText, saltA, 3]);
await write(walletB, 'happy_reveal_claim', 'reveal_claim', [1, claimantText, saltB, 4]);
await write(walletB, 'happy_assess', 'assess_match', [1, 5], 600n); c1 = await read(walletA, 'get_case', [1]); const a1 = await read(walletA, 'get_assessment', [1]); check(c1.status === 'MATCH_READY' && Number(c1.revision) === 6 && a1.result === 'MATCH_READY', 'happy match ready', { case: c1, assessment: a1 });
await write(walletB, 'outsider_issue_rejected', 'issue_release', [1, 6]); c1 = await read(walletA, 'get_case', [1]); check(c1.status === 'MATCH_READY' && c1.release_ticket_digest === '' && Number(c1.revision) === 6, 'outsider issue no mutation', c1);
await write(walletA, 'happy_issue_release', 'issue_release', [1, 6]); c1 = await read(walletA, 'get_case', [1]); const ticket = c1.release_ticket_digest; check(c1.status === 'RELEASE_AUTHORIZED' && ticket.startsWith('sha256:'), 'release authorized', c1);
await write(walletA, 'wrong_ticket_rejected', 'consume_release', [1, 'sha256:' + 'f'.repeat(64), 7]); c1 = await read(walletA, 'get_case', [1]); check(c1.status === 'RELEASE_AUTHORIZED' && c1.release_consumed === false && Number(c1.revision) === 7, 'wrong ticket no mutation', c1);
await write(walletA, 'happy_consume', 'consume_release', [1, ticket, 7]); c1 = await read(walletA, 'get_case', [1]); check(c1.status === 'RELEASED' && c1.release_consumed === true && c1.custodian_description === '' && c1.claimant_description === '' && Number(c1.revision) === 8, 'release consumed', c1);
const terminal = JSON.stringify(c1); await write(walletA, 'replay_rejected', 'consume_release', [1, ticket, 8]); c1 = await read(walletA, 'get_case', [1]); check(JSON.stringify(c1) === terminal, 'replay no mutation', c1);

// Case 2: conflict route can never produce a ticket.
await write(walletA, 'conflict_open', 'open_case', [ref('conflict')]);
await write(walletA, 'conflict_commit_custodian', 'commit_custodian', [2, commitment(2, 'CUSTODIAN', custodianText, saltA), 1]);
await write(walletB, 'conflict_commit_claim', 'commit_claim', [2, commitment(2, 'CLAIMANT', conflictText, saltB), 2]);
await write(walletA, 'conflict_reveal_custodian', 'reveal_custodian', [2, custodianText, saltA, 3]);
await write(walletB, 'conflict_reveal_claim', 'reveal_claim', [2, conflictText, saltB, 4]);
await write(walletB, 'conflict_assess', 'assess_match', [2, 5], 600n); const c2 = await read(walletA, 'get_case', [2]); const a2 = await read(walletA, 'get_assessment', [2]); check(c2.status === 'NO_MATCH' && c2.release_ticket_digest === '' && a2.result === 'NO_MATCH', 'conflict blocked', { case: c2, assessment: a2 });
await write(walletA, 'conflict_issue_rejected', 'issue_release', [2, 6]); const c2after = await read(walletA, 'get_case', [2]); check(JSON.stringify(c2after) === JSON.stringify(c2), 'conflict cannot issue', c2after);

const counts = await read(walletA, 'get_counts'); check(Number(counts.cases) === 2 && Number(counts.assessments) === 2, 'final counts', counts);
console.log('e2e.result=PASS');
