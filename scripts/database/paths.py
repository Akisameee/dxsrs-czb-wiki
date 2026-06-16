from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT / "re/jadx/resources/assets/bin/Data/8c496bdddc14441489a3cf750a42c690"
DEFAULT_ENUM_SOURCE = ROOT / "re/dump/cpp2il_analysis/types/Assembly-CSharp"
DEFAULT_NPC_TABLE_JSON = ROOT / "re/raw/tables/016-Npc.json"
DEFAULT_MERIDIAN_TABLE_JSON = ROOT / "re/raw/tables/034-JingMai.json"
OUTPUT = ROOT / "public/data/wiki.sqlite"
