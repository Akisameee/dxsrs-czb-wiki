<script setup lang="ts">
import { Check, RotateCcw } from "@lucide/vue";
import { Badge } from "~/components/ui/badge";
import {
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import EditableBooleanField from "~/components/tools/save-edit/fields/EditableBooleanField.vue";
import type { SaveEditMeridianGroup } from "~/lib/save-edit";

type MeridianRow = {
  name: string;
  strength: number;
  constitution: number;
  physique: number;
  agility: number;
  action_points: number;
  lifespan: number;
  martial_art_limit: number;
  cost: number;
};

const props = defineProps<{
  groups: SaveEditMeridianGroup[];
  selected: string[];
  initialSelected: string[];
}>();

const emit = defineEmits<{
  updateSelected: [value: string[]];
  reset: [];
}>();

const { queryRows } = useWikiDb();
const { data: meridianRows } = await useAsyncData(
  "save-edit-meridian-bonuses",
  () => queryRows<MeridianRow>(
    `SELECT name, strength, constitution, physique, agility,
      action_points, lifespan, martial_art_limit, cost
     FROM meridians
     ORDER BY meridian_id, point_index`,
  ),
  { server: false },
);

const selectedSet = computed(() => new Set(props.selected));
const initialSelectedSet = computed(() => new Set(props.initialSelected));
const dirty = computed(() => props.selected.length !== props.initialSelected.length || props.selected.some((point) => !initialSelectedSet.value.has(point)));
const meridianByName = computed(() => new Map((meridianRows.value || []).map((row) => [row.name, row])));

function updatePoint(point: string, value: string) {
  const next = new Set(props.selected);
  if (value === "true") next.add(point);
  else next.delete(point);
  emit("updateSelected", orderedValues(next));
}

function toggleGroup(group: SaveEditMeridianGroup) {
  const next = new Set(props.selected);
  const everySelected = group.points.every((point) => next.has(point));
  for (const point of group.points) {
    if (everySelected) next.delete(point);
    else next.add(point);
  }
  emit("updateSelected", orderedValues(next));
}

function orderedValues(values: Set<string>) {
  return props.groups.flatMap((group) => group.points).filter((point) => values.has(point));
}

function meridianBonusText(point: string) {
  const row = meridianByName.value.get(point);
  if (!row) return "";
  return [
    bonusText("膂力", row.strength),
    bonusText("根骨", row.constitution),
    bonusText("体魄", row.physique),
    bonusText("身法", row.agility),
    bonusText("行动力上限", row.action_points),
    bonusText("寿命", row.lifespan),
    bonusText("武功上限", row.martial_art_limit),
    row.cost > 0 ? `消耗真元 ${row.cost}` : "",
  ].filter(Boolean).join(" ");
}

function bonusText(label: string, value: number) {
  if (!value) return "";
  return `${label} ${value > 0 ? "+" : ""}${value}`;
}
</script>

<template>
  <AppCard>
    <AppCardHeader class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div class="grid gap-1">
        <CardTitle>经脉列表</CardTitle>
        <CardDescription>勾选要解锁的穴位，保存后会写回经脉 ES2 小存档</CardDescription>
      </div>

      <AppButton
        v-if="dirty"
        type="button"
        variant="ghost"
        size="icon"
        class="size-6 rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground"
        @click="emit('reset')"
      >
        <RotateCcw class="size-3.5" />
        <span class="sr-only">重置所有修改</span>
      </AppButton>
    </AppCardHeader>

    <AppCardContent class="grid gap-4 md:grid-cols-2">
      <section
        v-for="group in groups"
        :key="group.name"
        class="grid gap-3 rounded-md border p-3"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-medium">{{ group.name }}</h3>
            <Badge variant="secondary">
              {{ group.points.filter((point) => selectedSet.has(point)).length }} / {{ group.points.length }}
            </Badge>
          </div>
          <AppButton type="button" size="sm" variant="outline" @click="toggleGroup(group)">
            <Check class="size-4" />
            {{ group.points.every((point) => selectedSet.has(point)) ? "取消全选" : "全选" }}
          </AppButton>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div
            v-for="point in group.points"
            :key="point"
            class="grid gap-1 text-xs text-muted-foreground"
          >
            <span class="truncate whitespace-nowrap">
              <span class="font-medium text-foreground">{{ point }}</span>
              <span v-if="meridianBonusText(point)" class="text-muted-foreground">
                {{ " " }}{{ meridianBonusText(point) }}
              </span>
            </span>
            <EditableBooleanField
              true-value="true"
              false-value="false"
              compact
              true-label="已解锁"
              false-label="未解锁"
              :initial-value="initialSelectedSet.has(point) ? 'true' : 'false'"
              :model-value="selectedSet.has(point) ? 'true' : 'false'"
              @update="updatePoint(point, $event)"
            />
          </div>
        </div>
      </section>
    </AppCardContent>
  </AppCard>
</template>
