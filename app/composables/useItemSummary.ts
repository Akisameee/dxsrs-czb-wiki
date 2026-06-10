import type { MaybeRefOrGetter } from "vue";
import { computed, ref, shallowRef, toValue, watch } from "vue";
import { enumMapFromRows } from "~/lib/utils";
import {
  buildItemSummary,
  type ItemSummary,
  type ItemSummaryRow,
  type WikiEnums,
} from "~/lib/wiki/item";

type EnumRow = { type: string; id: number; label: string | null };

const summaryCache = new Map<number, ItemSummary | null>();
let enumsPromise: Promise<WikiEnums> | null = null;

export function useItemSummary(id: MaybeRefOrGetter<number | string | null | undefined>) {
  const { queryRows } = useWikiDb();
  const summary = shallowRef<ItemSummary | null>(null);
  const pending = ref(false);
  const error = shallowRef<Error | null>(null);

  const itemId = computed(() => {
    const value = Number(toValue(id));
    return Number.isFinite(value) ? value : null;
  });

  async function loadEnums() {
    enumsPromise ||= queryRows<EnumRow>("SELECT type, id, label FROM enums ORDER BY type, id")
      .then((rows) => enumMapFromRows(rows));
    return enumsPromise;
  }

  async function load() {
    const value = itemId.value;
    if (value === null) return null;

    if (summaryCache.has(value)) {
      summary.value = summaryCache.get(value) || null;
      return summary.value;
    }

    pending.value = true;
    error.value = null;
    try {
      const [items, enums] = await Promise.all([
        queryRows<ItemSummaryRow>(
          `SELECT id, icon, description, type_id, rarity_id, use_type_id, use_text, use_value,
            use_value2, use_value3, cost, required_strength, required_constitution,
            required_physique, required_agility, required_cultivation, required_mastery, is_material
           FROM items
           WHERE id = ?`,
          [value],
        ),
        loadEnums(),
      ]);

      const item = items[0] || null;
      const nextSummary = item ? buildItemSummary(item, enums) : null;
      summaryCache.set(value, nextSummary);
      summary.value = nextSummary;
      return nextSummary;
    } catch (caught) {
      error.value = caught instanceof Error ? caught : new Error(String(caught));
      return null;
    } finally {
      pending.value = false;
    }
  }

  watch(itemId, () => {
    const value = itemId.value;
    summary.value = value === null ? null : summaryCache.get(value) || null;
    error.value = null;
  });

  return { summary, pending, error, load };
}
