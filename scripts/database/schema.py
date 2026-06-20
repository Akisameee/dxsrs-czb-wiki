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
  "sects": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "name": "TEXT",
      "legacy_id": "INTEGER",
      "legacy_name": "TEXT"
    }
  },
  "characters": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "name": "TEXT",
      "legacy_id": "INTEGER",
      "legacy_name": "TEXT",
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
      "martial_art_id": "INTEGER NOT NULL",
      "current_level": "INTEGER NOT NULL",
      "max_level": "INTEGER NOT NULL",
      "current_exp": "INTEGER NOT NULL",
      "max_exp": "INTEGER NOT NULL"
    }
  },
  "npc_martial_art_pools": {
    "primaryKey": [
      "martial_type_id",
      "pool_index"
    ],
    "columns": {
      "martial_type_id": "INTEGER NOT NULL",
      "pool_index": "INTEGER NOT NULL",
      "martial_art_id": "INTEGER NOT NULL"
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
  "character_invitation_requirements": {
    "primaryKey": [
      "character_id",
      "slot"
    ],
    "columns": {
      "character_id": "INTEGER NOT NULL",
      "slot": "INTEGER NOT NULL",
      "legacy_name": "TEXT",
      "type_id": "INTEGER NOT NULL",
      "int_value": "INTEGER",
      "string_value": "TEXT",
      "sort_order": "INTEGER NOT NULL"
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
      "name": "TEXT",
      "legacy_name": "TEXT",
      "image_id": "TEXT",
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
  "item_inventory_templates": {
    "primaryKey": [
      "item_id"
    ],
    "columns": {
      "item_id": "INTEGER NOT NULL",
      "source_row_index": "INTEGER NOT NULL",
      "template_name": "TEXT",
      "daojuname": "TEXT",
      "showname": "TEXT",
      "type_id": "INTEGER",
      "rarity_id": "INTEGER",
      "zhuangbeiid": "INTEGER",
      "att": "INTEGER",
      "def": "INTEGER",
      "hp": "INTEGER",
      "weight": "REAL",
      "length": "REAL",
      "zhushuxing": "INTEGER",
      "lvli": "INTEGER",
      "gengu": "INTEGER",
      "tipo": "INTEGER",
      "shenfa": "INTEGER",
      "showlv": "INTEGER",
      "hidelv": "INTEGER",
      "mingkecitiao": "TEXT",
      "mingke_fg": "INTEGER",
      "mingke_lvli": "INTEGER",
      "mingke_gengu": "INTEGER",
      "mingke_tipo": "INTEGER",
      "mingke_shenfa": "INTEGER"
    }
  },
  "item_recipes": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "item_id": "INTEGER NOT NULL",
      "template_name": "TEXT",
      "recipe_name": "TEXT",
      "product_name": "TEXT",
      "type_id": "INTEGER",
      "quantity": "INTEGER",
      "rarity_id": "INTEGER",
      "material_1_name": "TEXT",
      "material_1_item_id": "INTEGER",
      "material_1_quantity": "INTEGER",
      "material_2_name": "TEXT",
      "material_2_item_id": "INTEGER",
      "material_2_quantity": "INTEGER",
      "material_3_name": "TEXT",
      "material_3_item_id": "INTEGER",
      "material_3_quantity": "INTEGER",
      "length_min": "REAL",
      "length_max": "REAL",
      "weight_min": "REAL",
      "weight_max": "REAL",
      "att_min": "INTEGER",
      "att_max": "INTEGER",
      "def_min": "INTEGER",
      "def_max": "INTEGER",
      "hp_min": "INTEGER",
      "hp_max": "INTEGER",
      "main_attribute_min": "INTEGER",
      "main_attribute_max": "INTEGER",
      "bonus_count_min": "INTEGER",
      "bonus_count_max": "INTEGER",
      "bonus_value_min": "INTEGER",
      "bonus_value_max": "INTEGER",
      "fixed_strength": "INTEGER NOT NULL",
      "fixed_constitution": "INTEGER NOT NULL",
      "fixed_physique": "INTEGER NOT NULL",
      "fixed_agility": "INTEGER NOT NULL",
      "is_learned": "INTEGER NOT NULL",
      "required_level": "INTEGER",
      "is_basic": "INTEGER NOT NULL",
      "is_basic_material": "INTEGER NOT NULL",
      "can_buy": "INTEGER NOT NULL"
    }
  },
  "item_recipe_unlocks": {
    "primaryKey": [
      "unlock_item_id",
      "recipe_id"
    ],
    "columns": {
      "unlock_item_id": "INTEGER NOT NULL",
      "recipe_id": "INTEGER NOT NULL",
      "product_item_id": "INTEGER NOT NULL"
    }
  },
  "inventory_presets": {
    "primaryKey": [
      "source_row_index"
    ],
    "columns": {
      "source_row_index": "INTEGER NOT NULL",
      "legacy_name": "TEXT",
      "legacy_character_name": "TEXT",
      "legacy_item_name": "TEXT",
      "character_id": "INTEGER NOT NULL",
      "item_id": "INTEGER NOT NULL",
      "type_id": "INTEGER",
      "equipment_id": "INTEGER",
      "quantity": "INTEGER",
      "rarity_id": "INTEGER",
      "att": "INTEGER",
      "def": "INTEGER",
      "hp": "INTEGER",
      "weight": "REAL",
      "length": "REAL",
      "main_attribute": "INTEGER",
      "strength": "INTEGER",
      "constitution": "INTEGER",
      "physique": "INTEGER",
      "agility": "INTEGER",
      "is_equipped": "INTEGER NOT NULL",
      "show_level": "INTEGER",
      "hide_level": "INTEGER",
      "is_new": "INTEGER NOT NULL",
      "show_name": "TEXT",
      "inscription": "TEXT",
      "inscription_fg": "INTEGER",
      "inscription_strength": "INTEGER",
      "inscription_constitution": "INTEGER",
      "inscription_physique": "INTEGER",
      "inscription_agility": "INTEGER",
      "redpoint": "INTEGER NOT NULL",
      "selected": "INTEGER NOT NULL",
      "uid": "TEXT"
    }
  },
  "shop": {
    "primaryKey": [
      "source_row_index"
    ],
    "columns": {
      "source_row_index": "INTEGER NOT NULL",
      "legacy_name": "TEXT",
      "legacy_character_name": "TEXT",
      "legacy_item_name": "TEXT",
      "character_id": "INTEGER NOT NULL",
      "item_id": "INTEGER NOT NULL",
      "type_id": "INTEGER",
      "min_quantity": "INTEGER",
      "max_quantity": "INTEGER",
      "rarity_id": "INTEGER",
      "chance": "REAL"
    }
  },
  "inscriptions": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "name": "TEXT",
      "legacy_name": "TEXT",
      "style_id": "INTEGER",
      "bonus_count": "INTEGER",
      "bonus_value_min": "INTEGER",
      "bonus_value_max": "INTEGER",
      "fixed_strength": "INTEGER NOT NULL",
      "fixed_constitution": "INTEGER NOT NULL",
      "fixed_physique": "INTEGER NOT NULL",
      "fixed_agility": "INTEGER NOT NULL",
      "material_1_name": "TEXT",
      "material_1_item_id": "INTEGER",
      "material_1_quantity": "INTEGER",
      "material_2_name": "TEXT",
      "material_2_item_id": "INTEGER",
      "material_2_quantity": "INTEGER",
      "material_3_name": "TEXT",
      "material_3_item_id": "INTEGER",
      "material_3_quantity": "INTEGER"
    }
  },
  "image_manifest": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "TEXT NOT NULL",
      "atlas": "TEXT NOT NULL",
      "atlas_width": "INTEGER NOT NULL",
      "atlas_height": "INTEGER NOT NULL",
      "x": "INTEGER NOT NULL",
      "y": "INTEGER NOT NULL",
      "width": "INTEGER NOT NULL",
      "height": "INTEGER NOT NULL",
      "texture_width": "INTEGER NOT NULL",
      "texture_height": "INTEGER NOT NULL",
      "trim_x": "INTEGER NOT NULL",
      "trim_y": "INTEGER NOT NULL",
      "trim_width": "INTEGER NOT NULL",
      "trim_height": "INTEGER NOT NULL",
      "trim_trimmed": "INTEGER NOT NULL"
    }
  },
  "martial_arts": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "INTEGER NOT NULL",
      "name": "TEXT",
      "legacy_id": "INTEGER",
      "legacy_name": "TEXT",
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
  "passives": {
    "primaryKey": [
      "id"
    ],
    "columns": {
      "id": "TEXT NOT NULL",
      "template": "TEXT NOT NULL",
      "image_id": "TEXT"
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
  "asset_effects": {
    "primaryKey": [
      "kind",
      "effect_id"
    ],
    "columns": {
      "kind": "TEXT NOT NULL",
      "effect_id": "INTEGER NOT NULL",
      "array_name": "TEXT",
      "array_index": "INTEGER",
      "prefab_name": "TEXT",
      "image_id": "TEXT",
      "duration": "REAL",
      "layer_count": "INTEGER NOT NULL"
    }
  },
  "asset_effect_layers": {
    "primaryKey": [
      "kind",
      "effect_id",
      "layer_index",
      "texture_slot"
    ],
    "columns": {
      "kind": "TEXT NOT NULL",
      "effect_id": "INTEGER NOT NULL",
      "layer_index": "INTEGER NOT NULL",
      "texture_slot": "INTEGER NOT NULL",
      "game_object_name": "TEXT",
      "depth": "INTEGER NOT NULL",
      "renderer_type": "TEXT",
      "sorting_order": "INTEGER NOT NULL",
      "material_name": "TEXT",
      "texture_property": "TEXT",
      "image_id": "TEXT NOT NULL",
      "duration": "REAL",
      "simulation_speed": "REAL",
      "looping": "INTEGER NOT NULL",
      "uv_enabled": "INTEGER NOT NULL",
      "tiles_x": "INTEGER NOT NULL",
      "tiles_y": "INTEGER NOT NULL",
      "frame_count": "INTEGER NOT NULL",
      "fps": "REAL",
      "cycles": "REAL",
      "row_mode": "INTEGER",
      "row_index": "INTEGER",
      "start_frame": "REAL",
      "frame_curve": "TEXT",
      "start_size": "REAL",
      "start_lifetime": "REAL",
      "start_lifetime_curve": "TEXT",
      "start_speed": "REAL",
      "start_speed_curve": "TEXT",
      "start_color": "TEXT",
      "start_rotation": "REAL",
      "gravity_modifier": "REAL",
      "gravity_modifier_curve": "TEXT",
      "max_particles": "INTEGER",
      "size_curve": "TEXT",
      "color_gradient": "TEXT",
      "rotation_enabled": "INTEGER NOT NULL",
      "rotation_curve": "TEXT",
      "burst_count": "INTEGER NOT NULL",
      "emission_rate": "REAL",
      "emission_rate_curve": "TEXT",
      "emission_bursts": "TEXT",
      "shape_enabled": "INTEGER NOT NULL",
      "shape_type": "INTEGER",
      "shape_angle": "REAL",
      "shape_radius": "REAL",
      "shape_arc": "REAL",
      "shape_length": "REAL",
      "shape_position_x": "REAL",
      "shape_position_y": "REAL",
      "shape_position_z": "REAL",
      "shape_rotation_x": "REAL",
      "shape_rotation_y": "REAL",
      "shape_rotation_z": "REAL",
      "shape_scale_x": "REAL",
      "shape_scale_y": "REAL",
      "shape_scale_z": "REAL",
      "random_direction_amount": "REAL",
      "spherical_direction_amount": "REAL",
      "random_position_amount": "REAL",
      "velocity_enabled": "INTEGER NOT NULL",
      "velocity_x": "TEXT",
      "velocity_y": "TEXT",
      "velocity_z": "TEXT",
      "velocity_radial": "TEXT",
      "velocity_orbital_x": "TEXT",
      "velocity_orbital_y": "TEXT",
      "velocity_orbital_z": "TEXT",
      "force_enabled": "INTEGER NOT NULL",
      "force_x": "TEXT",
      "force_y": "TEXT",
      "force_z": "TEXT"
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
      "passive_id": "TEXT NOT NULL",
      "param1": "REAL",
      "param2": "REAL"
    }
  },
  "portrait_part_assets": {
    "primaryKey": [
      "name"
    ],
    "columns": {
      "name": "TEXT NOT NULL",
      "image_id": "TEXT",
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
      "slot": "TEXT NOT NULL",
      "sort_order": "INTEGER NOT NULL",
      "image_id": "TEXT",
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
  },
  "meridians": {
    "primaryKey": [
      "name"
    ],
    "columns": {
      "name": "TEXT NOT NULL",
      "meridian_id": "INTEGER NOT NULL",
      "point_index": "INTEGER NOT NULL",
      "strength": "INTEGER NOT NULL",
      "constitution": "INTEGER NOT NULL",
      "physique": "INTEGER NOT NULL",
      "agility": "INTEGER NOT NULL",
      "action_points": "INTEGER NOT NULL",
      "lifespan": "INTEGER NOT NULL",
      "martial_art_limit": "INTEGER NOT NULL",
      "cost": "INTEGER NOT NULL",
      "is_acupoint": "INTEGER NOT NULL",
      "parent": "TEXT"
    }
  }
}

INDEXES = [
  "CREATE INDEX idx_characters_location ON characters(region_id, location_id)",
  "CREATE INDEX idx_characters_legacy_name ON characters(legacy_name)",
  "CREATE INDEX idx_characters_sect ON characters(sect_id)",
  "CREATE INDEX idx_characters_rarity ON characters(rarity_id)",
  "CREATE INDEX idx_characters_weapon ON characters(weapon_type_id)",
  "CREATE INDEX idx_location_characters_character ON location_characters(character_id)",
  "CREATE INDEX idx_character_martial_arts_character ON character_martial_arts(character_id)",
  "CREATE INDEX idx_character_martial_arts_martial ON character_martial_arts(martial_art_id)",
  "CREATE INDEX idx_npc_martial_art_pools_type ON npc_martial_art_pools(martial_type_id)",
  "CREATE INDEX idx_npc_martial_art_pools_martial ON npc_martial_art_pools(martial_art_id)",
  "CREATE INDEX idx_character_attribute_snapshots_character ON character_attribute_snapshots(character_id)",
  "CREATE INDEX idx_character_quests_character ON character_quests(character_id)",
  "CREATE INDEX idx_character_quests_type ON character_quests(quest_type_id)",
  "CREATE INDEX idx_character_quests_reward_item ON character_quests(reward_item_id)",
  "CREATE INDEX idx_character_quest_targets_quest ON character_quest_targets(quest_id)",
  "CREATE INDEX idx_character_invitation_requirements_character ON character_invitation_requirements(character_id)",
  "CREATE INDEX idx_character_invitation_requirements_type ON character_invitation_requirements(type_id)",
  "CREATE INDEX idx_items_type ON items(type_id)",
  "CREATE INDEX idx_items_image ON items(image_id)",
  "CREATE INDEX idx_item_inventory_templates_type ON item_inventory_templates(type_id)",
  "CREATE INDEX idx_item_inventory_templates_rarity ON item_inventory_templates(rarity_id)",
  "CREATE INDEX idx_item_inventory_templates_daojuname ON item_inventory_templates(daojuname)",
  "CREATE INDEX idx_item_recipes_item ON item_recipes(item_id)",
  "CREATE INDEX idx_item_recipes_type ON item_recipes(type_id)",
  "CREATE INDEX idx_item_recipes_material_1 ON item_recipes(material_1_item_id)",
  "CREATE INDEX idx_item_recipes_material_2 ON item_recipes(material_2_item_id)",
  "CREATE INDEX idx_item_recipes_material_3 ON item_recipes(material_3_item_id)",
  "CREATE INDEX idx_item_recipe_unlocks_recipe ON item_recipe_unlocks(recipe_id)",
  "CREATE INDEX idx_item_recipe_unlocks_product ON item_recipe_unlocks(product_item_id)",
  "CREATE INDEX idx_inventory_presets_character ON inventory_presets(character_id)",
  "CREATE INDEX idx_inventory_presets_item ON inventory_presets(item_id)",
  "CREATE INDEX idx_inventory_presets_type ON inventory_presets(type_id)",
  "CREATE INDEX idx_shop_character ON shop(character_id)",
  "CREATE INDEX idx_shop_item ON shop(item_id)",
  "CREATE INDEX idx_shop_type ON shop(type_id)",
  "CREATE INDEX idx_inscriptions_style ON inscriptions(style_id)",
  "CREATE INDEX idx_inscriptions_material_1 ON inscriptions(material_1_item_id)",
  "CREATE INDEX idx_inscriptions_material_2 ON inscriptions(material_2_item_id)",
  "CREATE INDEX idx_inscriptions_material_3 ON inscriptions(material_3_item_id)",
  "CREATE INDEX idx_image_manifest_atlas ON image_manifest(atlas)",
  "CREATE INDEX idx_items_legacy_name ON items(legacy_name)",
  "CREATE INDEX idx_items_rarity ON items(rarity_id)",
  "CREATE INDEX idx_sects_legacy_name ON sects(legacy_name)",
  "CREATE INDEX idx_martial_arts_sect ON martial_arts(sect_id)",
  "CREATE INDEX idx_martial_arts_legacy_name ON martial_arts(legacy_name)",
  "CREATE INDEX idx_martial_arts_type ON martial_arts(type_id)",
  "CREATE INDEX idx_martial_arts_rarity ON martial_arts(rarity_id)",
  "CREATE INDEX idx_martial_art_styles_style ON martial_art_styles(style_id)",
  "CREATE INDEX idx_martial_art_effects_effect ON martial_art_effects(effect_id)",
  "CREATE INDEX idx_martial_art_levels_martial ON martial_art_levels(martial_art_id)",
  "CREATE INDEX idx_asset_effect_layers_effect ON asset_effect_layers(kind, effect_id, sorting_order, layer_index)",
  "CREATE INDEX idx_asset_effect_layers_image ON asset_effect_layers(image_id)",
  "CREATE INDEX idx_portrait_part_assets_slot ON portrait_part_assets(slot_id)",
  "CREATE INDEX idx_portrait_part_assets_image ON portrait_part_assets(image_id)",
  "CREATE INDEX idx_portrait_part_options_type ON portrait_part_options(type_id)",
  "CREATE INDEX idx_portrait_part_options_sex ON portrait_part_options(sex_id)",
  "CREATE INDEX idx_portrait_weapon_parts_weapon ON portrait_weapon_parts(weapon_type_id)",
  "CREATE INDEX idx_portrait_prefab_layers_image ON portrait_prefab_layers(image_id)",
  "CREATE INDEX idx_custom_martial_effect_rates_effect ON custom_martial_effect_rates(effect_id)",
  "CREATE INDEX idx_meridians_meridian ON meridians(meridian_id, point_index)"
]
