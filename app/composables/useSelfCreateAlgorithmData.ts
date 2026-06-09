import { enumMapFromRows, groupBy } from "~/lib/utils";

type SqlNumber = number | string | null;

function numberValue(value: SqlNumber, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function useSelfCreateAlgorithmData() {
  const { queryRows } = useWikiDb();

  return useAsyncData("self-create-algorithm-data", async () => {
    const [
      templates,
      templateEffects,
      styleWeights,
      powerRanges,
      effectRates,
      effects,
      enumRows,
    ] = await Promise.all([
      queryRows<Record<string, any>>("SELECT * FROM custom_martial_arts ORDER BY id"),
      queryRows<Record<string, any>>("SELECT * FROM custom_martial_art_effects ORDER BY custom_martial_art_id, slot"),
      queryRows<Record<string, any>>("SELECT * FROM custom_style_weights ORDER BY id"),
      queryRows<Record<string, any>>("SELECT * FROM custom_martial_power_ranges ORDER BY id"),
      queryRows<Record<string, any>>("SELECT * FROM custom_martial_effect_rates ORDER BY id"),
      queryRows<Record<string, any>>("SELECT id, value_per_level AS valuePerLevel, template FROM status_effects ORDER BY id"),
      queryRows<{ type: string; id: number; label: string | null }>("SELECT type, id, label FROM enums ORDER BY type, id"),
    ]);

    const enums = enumMapFromRows(enumRows);
    const effectsByTemplate = groupBy(templateEffects, "custom_martial_art_id");
    const data = {
      wugongRows: templates.map((row) => {
        const effectSlots = new Map((effectsByTemplate.get(row.id) || []).map((item) => [Number(item.slot), item]));
        const output: Record<string, any> = {
          chnname: enums.MartialArt?.[String(row.id)] || `武学 ${row.id}`,
          type: numberValue(row.type_id),
          rare: numberValue(row.rarity_id),
          cost: numberValue(row.cost),
          slashfx: numberValue(row.slash_effect_id),
          hitfx: numberValue(row.hit_effect_id),
          attackareaname: enums.AttackArea?.[String(row.attack_area_id)] || "",
          iszichuang: Boolean(Number(row.is_custom)),
        };

        for (let slot = 1; slot <= 3; slot += 1) {
          const effect = effectSlots.get(slot);
          output[`buff${slot}`] = effect ? numberValue(effect.effect_id, 99) : 99;
          output[`bufftarget${slot}`] = effect ? numberValue(effect.target_id, 1) : 1;
        }
        return output;
      }),
      chainRows: styleWeights.map((row) => ({
        fengge: numberValue(row.style_id),
        qty: numberValue(row.weight),
      })),
      ziChuangWeiLiRows: powerRanges.map((row) => ({
        bingqitype: numberValue(row.weapon_type_id),
        rare: numberValue(row.rarity_id),
        cost: numberValue(row.cost),
        weilimin: numberValue(row.power_min),
        weilimax: numberValue(row.power_max),
        percentmin: numberValue(row.percent_min),
        percentmax: numberValue(row.percent_max),
      })),
      ziChuangBuffRows: effectRates.map((row) => ({
        rare: numberValue(row.rarity_id),
        bufftype: numberValue(row.effect_id),
        bufftarget: numberValue(row.target_id),
        value: numberValue(row.level),
        percent: numberValue(row.percent),
      })),
    };

    return {
      data,
      enums,
      effects: effects.map((row) => ({
        id: numberValue(row.id),
        name: enums.BuffType?.[String(row.id)] || `效果 ${row.id}`,
        valuePerLevel: row.valuePerLevel === null ? null : numberValue(row.valuePerLevel),
        template: row.template,
      })),
      effectNames: new Map(effects.map((item) => [Number(item.id), enums.BuffType?.[String(item.id)] || `效果 ${item.id}`])),
      styleNames: enums.LianSuo_FG || {},
    };
  }, { server: false });
}
