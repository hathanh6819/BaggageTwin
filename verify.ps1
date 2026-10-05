$ErrorActionPreference = "Stop"
python -m pytest tests -q
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
python -X utf8 -m genvm_linter.cli contracts/baggage_twin.py
exit $LASTEXITCODE
