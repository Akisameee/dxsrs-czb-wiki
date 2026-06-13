from __future__ import annotations

from scripts.images.effects import build_effect_assets


class AssetEffectBuilder:
    def __init__(self, ctx):
        self.ctx = ctx

    def rows(self):
        return build_effect_assets(self.ctx.source.parent)
