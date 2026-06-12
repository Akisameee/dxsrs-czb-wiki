from __future__ import annotations

TABLES = {
  "enums": {
    "primaryKey": [
      "type",
      "id"
    ],
    "columns": {
      "type": "TEXT NOT NULL",
      "id": "INTEGER NOT NULL",
      "label": "TEXT"
    }
  },
  "characters": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "portrait": "TEXT",
      "region_id": "INTEGER",
      "location_id": "INTEGER",
      "sect_id": "INTEGER",
      "sex_id": "INTEGER",
      "rarity_id": "INTEGER",
      "rank_id": "INTEGER",
      "position_id": "INTEGER",
      "level": "INTEGER",
      "favorite_rarity_id": "INTEGER",
      "fame": "INTEGER",
      "chivalry": "INTEGER",
      "gold": "INTEGER",
      "is_instructor": "INTEGER NOT NULL",
      "is_manager": "INTEGER NOT NULL",
      "weapon_type_id": "INTEGER",
      "growth_type_id": "INTEGER",
      "martial_type_id": "INTEGER",
      "equipment_weapon": "TEXT",
      "equipment_armor": "TEXT",
      "equipment_other_weapon": "TEXT",
      "strength": "REAL",
      "constitution": "REAL",
      "physique": "REAL",
      "agility": "REAL",
      "cultivation": "REAL",
      "fist": "REAL",
      "blade_sword": "REAL",
      "spear_staff": "REAL",
      "hidden_weapon": "REAL",
      "internal": "REAL",
      "growth_initial_value": "REAL",
      "growth_final_value": "REAL",
      "growth_base_level": "INTEGER",
      "base_strength": "REAL",
      "base_constitution": "REAL",
      "base_physique": "REAL",
      "base_agility": "REAL",
      "growth_strength": "REAL",
      "growth_constitution": "REAL",
      "growth_physique": "REAL",
      "growth_agility": "REAL",
      "mining": "INTEGER",
      "herb_gathering": "INTEGER",
      "hunting": "INTEGER",
      "forging": "INTEGER",
      "alchemy": "INTEGER",
      "sewing": "INTEGER",
      "likes_tea": "INTEGER NOT NULL",
      "likes_wine": "INTEGER NOT NULL",
      "likes_music": "INTEGER NOT NULL",
      "likes_chess": "INTEGER NOT NULL",
      "likes_book": "INTEGER NOT NULL",
      "likes_painting": "INTEGER NOT NULL",
      "word": "TEXT"
    }
  },
  "character_martial_arts": {
    "primaryKey": [
      "character_id",
      "slot"
    ],
    "columns": {
      "character_id": "INTEGER NOT NULL",
      "slot": "INTEGER NOT NULL",
      "level": "INTEGER NOT NULL",
      "martial_art_id": "INTEGER NOT NULL",
      "martial_level": "INTEGER NOT NULL"
    }
  },
  "character_attribute_snapshots": {
    "primaryKey": [
      "character_id",
      "slot"
    ],
    "columns": {
      "character_id": "INTEGER NOT NULL",
      "slot": "INTEGER NOT NULL",
      "level": "INTEGER",
      "power": "INTEGER",
      "rank_id": "INTEGER",
      "position_id": "INTEGER",
      "strength": "INTEGER",
      "constitution": "INTEGER",
      "physique": "INTEGER",
      "agility": "INTEGER",
      "cultivation": "INTEGER",
      "fist": "INTEGER",
      "blade_sword": "INTEGER",
      "spear_staff": "INTEGER",
      "hidden_weapon": "INTEGER",
      "internal": "INTEGER",
      "mining": "INTEGER",
      "herb_gathering": "INTEGER",
      "hunting": "INTEGER",
      "forging": "INTEGER",
      "alchemy": "INTEGER",
      "sewing": "INTEGER",
      "weapon": "TEXT",
      "armor": "TEXT",
      "fame": "INTEGER",
      "chivalry": "INTEGER"
    }
  },
  "character_quests": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "character_id": "INTEGER NOT NULL",
      "stage": "INTEGER NOT NULL",
      "required_affinity": "INTEGER NOT NULL",
      "quest_type_id": "INTEGER NOT NULL",
      "reward_item_id": "INTEGER",
      "sort_order": "INTEGER NOT NULL"
    }
  },
  "character_quest_targets": {
    "primaryKey": [
      "quest_id",
      "slot"
    ],
    "columns": {
      "quest_id": "INTEGER NOT NULL",
      "slot": "INTEGER NOT NULL",
      "target_role": "TEXT NOT NULL",
      "target_kind": "TEXT NOT NULL",
      "target_id": "INTEGER",
      "target_region_id": "INTEGER"
    }
  },
  "locations": {
    "primaryKey": [
      "region_id",
      "location_id"
    ],
    "columns": {
      "region_id": "INTEGER NOT NULL",
      "location_id": "INTEGER NOT NULL",
      "character_count": "INTEGER NOT NULL"
    }
  },
  "location_characters": {
    "primaryKey": [
      "region_id",
      "location_id",
      "character_id"
    ],
    "columns": {
      "region_id": "INTEGER NOT NULL",
      "location_id": "INTEGER NOT NULL",
      "character_id": "INTEGER NOT NULL",
      "sort_order": "INTEGER NOT NULL"
    }
  },
  "unplaced_characters": {
    "primaryKey": [
      "character_id"
    ],
    "columns": {
      "character_id": "INTEGER NOT NULL",
      "sort_order": "INTEGER NOT NULL"
    }
  },
  "items": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "icon": "TEXT",
      "description": "TEXT",
      "type_id": "INTEGER",
      "rarity_id": "INTEGER",
      "use_type_id": "INTEGER",
      "use_text": "TEXT",
      "use_value": "REAL",
      "use_value2": "INTEGER",
      "use_value3": "REAL",
      "cost": "REAL",
      "required_strength": "INTEGER",
      "required_constitution": "INTEGER",
      "required_physique": "INTEGER",
      "required_agility": "INTEGER",
      "required_cultivation": "INTEGER",
      "required_mastery": "INTEGER",
      "is_material": "INTEGER NOT NULL"
    }
  },
  "martial_arts": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "sect_id": "INTEGER",
      "type_id": "INTEGER",
      "rarity_id": "INTEGER",
      "attack_area_id": "INTEGER",
      "slash_effect_id": "INTEGER",
      "hit_effect_id": "INTEGER",
      "power": "REAL",
      "cost": "INTEGER",
      "interval": "INTEGER",
      "accuracy": "INTEGER",
      "obtain_method": "TEXT",
      "is_sect_restricted": "INTEGER NOT NULL",
      "is_custom_source": "INTEGER NOT NULL",
      "passive_1_id": "INTEGER",
      "passive_1_value": "REAL",
      "passive_2_id": "INTEGER",
      "passive_2_value": "REAL",
      "passive_3_id": "INTEGER",
      "passive_3_value": "REAL"
    }
  },
  "martial_art_styles": {
    "primaryKey": [
      "martial_art_id",
      "slot"
    ],
    "columns": {
      "martial_art_id": "INTEGER NOT NULL",
      "slot": "INTEGER NOT NULL",
      "style_id": "INTEGER NOT NULL"
    }
  },
  "martial_art_effects": {
    "primaryKey": [
      "martial_art_id",
      "slot"
    ],
    "columns": {
      "martial_art_id": "INTEGER NOT NULL",
      "slot": "INTEGER NOT NULL",
      "effect_id": "INTEGER NOT NULL",
      "target_id": "INTEGER",
      "level": "INTEGER NOT NULL"
    }
  },
  "martial_art_levels": {
    "primaryKey": [
      "martial_art_id",
      "level"
    ],
    "columns": {
      "martial_art_id": "INTEGER NOT NULL",
      "level": "INTEGER NOT NULL",
      "training_exp": "INTEGER",
      "required_strength": "INTEGER",
      "required_constitution": "INTEGER",
      "required_physique": "INTEGER",
      "required_agility": "INTEGER",
      "required_mastery": "INTEGER",
      "power": "REAL",
      "effect_1_level": "INTEGER",
      "effect_2_level": "INTEGER",
      "effect_3_level": "INTEGER",
      "hp": "INTEGER",
      "qi_recovery": "REAL"
    }
  },
  "martial_art_passive_templates": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "TEXT NOT NULL",
      "template": "TEXT NOT NULL"
    }
  },
  "status_effects": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "value_per_level": "REAL",
      "template": "TEXT"
    }
  },
  "passive_chains": {
    "primaryKey": [
      "passive_type",
      "id",
      "count"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "passive_type": "TEXT NOT NULL",
      "count": "INTEGER NOT NULL",
      "value": "TEXT NOT NULL"
    }
  },
  "portrait_part_assets": {
    "primaryKey": [
      "name"
    ],
    "columns": {
      "name": "TEXT NOT NULL",
      "path": "TEXT NOT NULL",
      "slot_id": "INTEGER NOT NULL",
      "sex": "TEXT",
      "parent": "TEXT"
    }
  },
  "portrait_part_options": {
    "primaryKey": [
      "name"
    ],
    "columns": {
      "name": "TEXT NOT NULL",
      "display_name": "TEXT",
      "type_id": "INTEGER NOT NULL",
      "sex_id": "INTEGER NOT NULL",
      "has_white": "INTEGER NOT NULL",
      "normal_parts": "TEXT NOT NULL",
      "white_parts": "TEXT NOT NULL",
      "is_player": "INTEGER NOT NULL",
      "sect_id": "INTEGER NOT NULL",
      "sect_level": "INTEGER NOT NULL",
      "sort_order": "INTEGER NOT NULL",
      "is_default": "INTEGER NOT NULL"
    }
  },
  "portrait_weapon_parts": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "name": "TEXT",
      "sect_id": "INTEGER NOT NULL",
      "sex_id": "INTEGER NOT NULL",
      "weapon_type_id": "INTEGER NOT NULL",
      "part_name": "TEXT NOT NULL"
    }
  },
  "portrait_prefabs": {
    "primaryKey": [
      "name"
    ],
    "columns": {
      "name": "TEXT NOT NULL",
      "source": "TEXT NOT NULL",
      "layer_count": "INTEGER NOT NULL",
      "is_layered": "INTEGER NOT NULL"
    }
  },
  "portrait_prefab_layers": {
    "primaryKey": [
      "portrait",
      "sort_order",
      "slot"
    ],
    "columns": {
      "portrait": "TEXT NOT NULL",
      "source": "TEXT NOT NULL",
      "slot": "TEXT NOT NULL",
      "sort_order": "INTEGER NOT NULL",
      "image_path_id": "INTEGER NOT NULL",
      "sprite_source": "TEXT",
      "sprite_path_id": "INTEGER",
      "texture_source": "TEXT",
      "texture_path_id": "INTEGER",
      "texture_name": "TEXT",
      "texture_width": "INTEGER",
      "texture_height": "INTEGER",
      "color_r": "REAL NOT NULL",
      "color_g": "REAL NOT NULL",
      "color_b": "REAL NOT NULL",
      "color_a": "REAL NOT NULL",
      "active": "INTEGER NOT NULL"
    }
  },
  "custom_martial_arts": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "type_id": "INTEGER",
      "rarity_id": "INTEGER",
      "cost": "INTEGER",
      "slash_effect_id": "INTEGER",
      "hit_effect_id": "INTEGER",
      "attack_area_id": "INTEGER",
      "is_custom": "INTEGER NOT NULL"
    }
  },
  "custom_martial_art_effects": {
    "primaryKey": [
      "custom_martial_art_id",
      "slot"
    ],
    "columns": {
      "custom_martial_art_id": "INTEGER NOT NULL",
      "slot": "INTEGER NOT NULL",
      "effect_id": "INTEGER NOT NULL",
      "target_id": "INTEGER"
    }
  },
  "custom_style_weights": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "style_id": "INTEGER NOT NULL",
      "weight": "INTEGER NOT NULL"
    }
  },
  "custom_martial_power_ranges": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "weapon_type_id": "INTEGER",
      "rarity_id": "INTEGER",
      "cost": "INTEGER",
      "power_min": "REAL",
      "power_max": "REAL",
      "percent_min": "REAL",
      "percent_max": "REAL"
    }
  },
  "custom_martial_effect_rates": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "rarity_id": "INTEGER NOT NULL",
      "effect_id": "INTEGER NOT NULL",
      "target_id": "INTEGER NOT NULL",
      "level": "INTEGER NOT NULL",
      "percent": "REAL NOT NULL"
    }
  }
}

INDEXES = [
  "CREATE INDEX idx_characters_location ON characters(region_id, location_id)",
  "CREATE INDEX idx_characters_sect ON characters(sect_id)",
  "CREATE INDEX idx_characters_rarity ON characters(rarity_id)",
  "CREATE INDEX idx_characters_weapon ON characters(weapon_type_id)",
  "CREATE INDEX idx_location_characters_character ON location_characters(character_id)",
  "CREATE INDEX idx_character_martial_arts_character ON character_martial_arts(character_id)",
  "CREATE INDEX idx_character_martial_arts_martial ON character_martial_arts(martial_art_id)",
  "CREATE INDEX idx_character_attribute_snapshots_character ON character_attribute_snapshots(character_id)",
  "CREATE INDEX idx_character_quests_character ON character_quests(character_id)",
  "CREATE INDEX idx_character_quests_type ON character_quests(quest_type_id)",
  "CREATE INDEX idx_character_quests_reward_item ON character_quests(reward_item_id)",
  "CREATE INDEX idx_character_quest_targets_quest ON character_quest_targets(quest_id)",
  "CREATE INDEX idx_items_type ON items(type_id)",
  "CREATE INDEX idx_items_rarity ON items(rarity_id)",
  "CREATE INDEX idx_martial_arts_sect ON martial_arts(sect_id)",
  "CREATE INDEX idx_martial_arts_type ON martial_arts(type_id)",
  "CREATE INDEX idx_martial_arts_rarity ON martial_arts(rarity_id)",
  "CREATE INDEX idx_martial_art_styles_style ON martial_art_styles(style_id)",
  "CREATE INDEX idx_martial_art_effects_effect ON martial_art_effects(effect_id)",
  "CREATE INDEX idx_martial_art_levels_martial ON martial_art_levels(martial_art_id)",
  "CREATE INDEX idx_portrait_part_assets_slot ON portrait_part_assets(slot_id)",
  "CREATE INDEX idx_portrait_part_options_type ON portrait_part_options(type_id)",
  "CREATE INDEX idx_portrait_part_options_sex ON portrait_part_options(sex_id)",
  "CREATE INDEX idx_portrait_weapon_parts_weapon ON portrait_weapon_parts(weapon_type_id)",
  "CREATE INDEX idx_portrait_prefab_layers_texture ON portrait_prefab_layers(texture_source, texture_path_id)",
  "CREATE INDEX idx_custom_martial_effect_rates_effect ON custom_martial_effect_rates(effect_id)"
]
