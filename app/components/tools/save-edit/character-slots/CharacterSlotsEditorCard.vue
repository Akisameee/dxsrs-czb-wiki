<script setup lang="ts">
import { RotateCcw } from "@lucide/vue";
import { Badge } from "~/components/ui/badge";
import {
  CardDescription,
  CardTitle,
} from "~/components/ui/card";
import EditableBooleanField from "~/components/tools/save-edit/fields/EditableBooleanField.vue";
import EditableEnumField, { type EditableEnumOption } from "~/components/tools/save-edit/fields/EditableEnumField.vue";
import EditableNumberField from "~/components/tools/save-edit/fields/EditableNumberField.vue";
import EditableTextField from "~/components/tools/save-edit/fields/EditableTextField.vue";
import PlayerPortraitEditor, { type PlayerPortraitPartKey, type PlayerPortraitValues } from "~/components/tools/save-edit/character/player/PlayerPortraitEditor.vue";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import type { Es2CunDang } from "~/lib/es2";

type EnumRow = {
  id: number;
  label: string | null;
};

const props = withDefaults(defineProps<{
  slots: Es2CunDang[];
  initialSlots: Es2CunDang[];
  dirty?: boolean;
}>(), {
  dirty: false,
});

const emit = defineEmits<{
  updateSlots: [value: Es2CunDang[]];
  reset: [];
}>();

const { queryRows } = useWikiDb();
const { data: lookupData } = await useAsyncData(
  "save-edit-character-slots-lookups",
  async () => {
    const [difficulties, sects] = await Promise.all([
      queryRows<EnumRow>(
        `SELECT id, label
         FROM enums
         WHERE type = 'Difficult'
         ORDER BY id`,
      ),
      queryRows<EnumRow>(
        `SELECT id, name AS label
         FROM sects
         ORDER BY id`,
      ),
    ]);
    return { difficulties, sects };
  },
  { server: false },
);

const activeSection = ref("normal");
const difficultyOptions = computed(() => enumOptions(lookupData.value?.difficulties || []));
const sectOptions = computed(() => enumOptions(lookupData.value?.sects || []));
const initialByUid = computed(() => new Map(props.initialSlots.map((slot) => [slot.uid, slot])));
const slotSections = computed(() => [
  {
    key: "normal",
    label: "人生剧",
    slots: indexedSlots(true),
  },
  {
    key: "xiaKe",
    label: "侠客传",
    slots: indexedSlots(false),
  },
]);

const portraitFieldKeys: PlayerPortraitPartKey[] = ["qianfa", "houfa", "maozi", "meimao", "lianshi", "yifu", "houbei", "huzi"];

function updateSlot(index: number, patch: Partial<Es2CunDang>) {
  const next = props.slots.map((slot, slotIndex) => {
    if (slotIndex !== index) return patch.isplaying ? { ...slot, isplaying: false } : slot;
    return { ...slot, ...patch };
  });
  emit("updateSlots", next);
}

function indexedSlots(isNormalMode: boolean) {
  return props.slots
    .map((slot, index) => ({ slot, index }))
    .filter((item) => item.slot.isNormalMode === isNormalMode)
    .sort((left, right) => left.slot.slotid - right.slot.slotid);
}

function slotUsed(slot: Es2CunDang) {
  return Boolean(slot.player || slot.savepath);
}

function initialSlot(slot: Es2CunDang) {
  return initialByUid.value.get(slot.uid) || slot;
}

function updateString(index: number, field: keyof Es2CunDang, value: string) {
  updateSlot(index, { [field]: value } as Partial<Es2CunDang>);
}

function updateNumber(index: number, field: keyof Es2CunDang, value: string) {
  const number = Number(value);
  updateSlot(index, { [field]: Number.isFinite(number) ? Math.trunc(number) : 0 } as Partial<Es2CunDang>);
}

function updateBoolean(index: number, field: keyof Es2CunDang, value: string) {
  updateSlot(index, { [field]: value === "true" } as Partial<Es2CunDang>);
}

function booleanValue(value: boolean) {
  return value ? "true" : "false";
}

function enumOptions(rows: EnumRow[]): EditableEnumOption[] {
  return rows.map((row) => ({
    value: String(row.id),
    label: row.label || String(row.id),
  }));
}

function slotPortraitValues(slot: Es2CunDang): PlayerPortraitValues {
  return Object.fromEntries(portraitFieldKeys.map((key) => [key, slot[key]])) as PlayerPortraitValues;
}

function updateSlotPortrait(index: number, key: PlayerPortraitPartKey, value: string) {
  updateString(index, key, value);
}

function updateSlotSex(index: number, value: number) {
  updateNumber(index, "sex", String(value));
}
</script>

<template>
  <AppCard>
    <AppCardHeader class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div class="grid gap-1">
        <CardTitle>槽位列表</CardTitle>
        <CardDescription>编辑存档槽索引文件本身的角色摘要信息</CardDescription>
      </div>

      <AppButton
        v-if="props.dirty"
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

    <AppCardContent>
      <Tabs v-model="activeSection" class="grid gap-3">
        <TabsList class="grid w-full grid-cols-2 sm:w-fit">
          <TabsTrigger
            v-for="section in slotSections"
            :key="section.key"
            :value="section.key"
            class="gap-1.5"
          >
            {{ section.label }}
            <Badge variant="secondary">
              {{ section.slots.filter((item) => slotUsed(item.slot)).length }} / {{ section.slots.length }}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          v-for="section in slotSections"
          :key="section.key"
          :value="section.key"
          class="grid gap-4"
        >
          <div
            v-for="{ slot, index } in section.slots"
            :key="slot.uid"
            class="grid items-start gap-6 rounded-md border p-3 lg:grid-cols-[240px_1fr]"
          >
            <div class="grid auto-rows-min gap-3">
              <div class="flex items-center justify-between gap-2">
                <div class="font-medium">{{ slotUsed(slot) ? slot.player || slot.uid : "空槽位" }}</div>
                <Badge :variant="slot.isplaying ? 'default' : 'secondary'">
                  {{ slot.isplaying ? "当前" : `槽 ${slot.slotid + 1}` }}
                </Badge>
              </div>
              <PlayerPortraitEditor
                :sex="slot.sex"
                :values="slotPortraitValues(slot)"
                :initial-values="slotPortraitValues(initialSlot(slot))"
                :fallback="slot.player.slice(0, 1) || String(slot.slotid + 1)"
                portrait-class="h-[160px] w-full max-w-[120px]"
                @update-sex="updateSlotSex(index, $event)"
                @update-part="(key, value) => updateSlotPortrait(index, key, value)"
              />
            </div>

            <div class="grid auto-rows-min gap-5">
              <div class="grid auto-rows-min gap-3 grid-cols-2 xl:grid-cols-4">
                <div class="grid gap-1 text-xs text-muted-foreground">
                  角色名
                  <EditableTextField
                    :initial-value="initialSlot(slot).player"
                    :model-value="slot.player"
                    compact
                    @update="updateString(index, 'player', $event)"
                  />
                </div>

                <div class="grid gap-1 text-xs text-muted-foreground">
                  存档文件
                  <EditableTextField
                    :initial-value="initialSlot(slot).savepath"
                    :model-value="slot.savepath"
                    compact
                    @update="updateString(index, 'savepath', $event)"
                  />
                </div>

                <div class="grid gap-1 text-xs text-muted-foreground">
                  当前槽
                  <EditableBooleanField
                    :initial-value="booleanValue(initialSlot(slot).isplaying)"
                    :model-value="booleanValue(slot.isplaying)"
                    true-label="当前"
                    false-label="非当前"
                    compact
                    @update="updateBoolean(index, 'isplaying', $event)"
                  />
                </div>

                <div class="grid gap-1 text-xs text-muted-foreground">
                  槽位
                  <EditableNumberField
                    :initial-value="String(initialSlot(slot).slotid)"
                    :model-value="String(slot.slotid)"
                    compact
                    @update="updateNumber(index, 'slotid', $event)"
                  />
                </div>

                <div class="grid gap-1 text-xs text-muted-foreground">
                  年龄
                  <EditableNumberField
                    :initial-value="String(initialSlot(slot).old)"
                    :model-value="String(slot.old)"
                    compact
                    @update="updateNumber(index, 'old', $event)"
                  />
                </div>

                <div class="grid gap-1 text-xs text-muted-foreground">
                  功力
                  <EditableNumberField
                    :initial-value="String(initialSlot(slot).gongli)"
                    :model-value="String(slot.gongli)"
                    compact
                    @update="updateNumber(index, 'gongli', $event)"
                  />
                </div>

                <div class="grid gap-1 text-xs text-muted-foreground">
                  门派
                  <EditableEnumField
                    :initial-value="String(initialSlot(slot).menPai)"
                    :model-value="String(slot.menPai)"
                    :options="sectOptions"
                    compact
                    @update="updateNumber(index, 'menPai', $event)"
                  />
                </div>

                <div class="grid gap-1 text-xs text-muted-foreground">
                  难度
                  <EditableEnumField
                    :initial-value="String(initialSlot(slot).difficult)"
                    :model-value="String(slot.difficult)"
                    :options="difficultyOptions"
                    compact
                    @update="updateNumber(index, 'difficult', $event)"
                  />
                </div>

                <div class="grid gap-1 text-xs text-muted-foreground">
                  主角
                  <EditableNumberField
                    :initial-value="String(initialSlot(slot).zhujue)"
                    :model-value="String(slot.zhujue)"
                    compact
                    @update="updateNumber(index, 'zhujue', $event)"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppCardContent>
  </AppCard>
</template>
