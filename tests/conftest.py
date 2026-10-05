import importlib.util
import json
import sys
import types
from pathlib import Path

import pytest


CUSTODIAN = "0x1111111111111111111111111111111111111111"
CLAIMANT = "0x2222222222222222222222222222222222222222"
OUTSIDER = "0x3333333333333333333333333333333333333333"
REFERENCE = "sha256:" + "a" * 64

CUSTODIAN_TEXT = (
    "Medium navy hard-shell spinner suitcase with a silver zipper, a broken "
    "rear-left wheel, and a yellow triangle sticker beside the handle."
)
CLAIMANT_TEXT = (
    "Dark navy medium polycarbonate roller suitcase with four wheels. The rear-left "
    "wheel is cracked and a yellow triangular sticker sits beside the handle."
)
CONFLICT_TEXT = (
    "Large red fabric duffel bag with a black shoulder strap, soft sides, and no wheels."
)
AMBIGUOUS_TEXT = (
    "A medium blue rolling suitcase with four wheels and no distinctive marks or accessories."
)
CUSTODIAN_SALT = "custodian-salt-2026"
CLAIMANT_SALT = "claimant-salt-2026"


class TreeMap(dict):
    @classmethod
    def __class_getitem__(cls, _):
        return cls


class U256(int):
    pass


class ContractBase:
    pass


class Write:
    def __call__(self, fn):
        return fn


class Public:
    write = Write()
    view = staticmethod(lambda fn: fn)


class Nondet:
    def __init__(self):
        self.answer = {
            "decision": "MATCH",
            "matched_traits": ["COLOR", "DAMAGE_MARK", "FORM", "MATERIAL", "SIZE"],
            "conflicting_traits": [],
            "distinctive_overlap": True,
        }
        self.prompts = []

    def exec_prompt(self, prompt, **_):
        self.prompts.append(prompt)
        if isinstance(self.answer, Exception):
            raise self.answer
        return self.answer


class Eq:
    def __init__(self):
        self.forced = None

    def prompt_comparative(self, fn, *_args, **_kwargs):
        return self.forced if self.forced is not None else fn()


@pytest.fixture
def runtime(monkeypatch):
    nondet = Nondet()
    eq = Eq()
    genlayer = types.ModuleType("genlayer")
    genlayer.__all__ = ["gl", "u256", "TreeMap", "typing"]
    genlayer.gl = genlayer
    genlayer.Contract = ContractBase
    genlayer.public = Public()
    genlayer.nondet = nondet
    genlayer.eq_principle = eq
    genlayer.message = types.SimpleNamespace(sender_address=CUSTODIAN)
    genlayer.message_raw = {"datetime": "2026-10-05T00:00:00+00:00"}
    genlayer.u256 = U256
    genlayer.TreeMap = TreeMap
    genlayer.typing = types.SimpleNamespace(Any=object)
    monkeypatch.setitem(sys.modules, "genlayer", genlayer)
    spec = importlib.util.spec_from_file_location(
        "baggage_twin_test", Path("contracts/baggage_twin.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module, module.BaggageTwin(), genlayer, nondet, eq


def set_sender(genlayer, address):
    genlayer.message.sender_address = address


def open_and_commit(module, contract, genlayer, claim_text=CLAIMANT_TEXT):
    case_id = contract.open_case(REFERENCE)
    custodian_commitment = module.reveal_commitment(
        case_id, "CUSTODIAN", CUSTODIAN_TEXT, CUSTODIAN_SALT
    )
    claimant_commitment = module.reveal_commitment(
        case_id, "CLAIMANT", claim_text, CLAIMANT_SALT
    )
    assert contract.commit_custodian(case_id, custodian_commitment, 1) == "CUSTODIAN_COMMITTED"
    set_sender(genlayer, CLAIMANT)
    assert contract.commit_claim(case_id, claimant_commitment, 2) == "BOTH_COMMITTED"
    return case_id


def fully_revealed(module, contract, genlayer, claim_text=CLAIMANT_TEXT):
    case_id = open_and_commit(module, contract, genlayer, claim_text)
    set_sender(genlayer, CUSTODIAN)
    assert (
        contract.reveal_custodian(case_id, CUSTODIAN_TEXT, CUSTODIAN_SALT, 3)
        == "CUSTODIAN_REVEALED"
    )
    set_sender(genlayer, CLAIMANT)
    assert (
        contract.reveal_claim(case_id, claim_text, CLAIMANT_SALT, 4)
        == "BOTH_REVEALED"
    )
    return case_id

