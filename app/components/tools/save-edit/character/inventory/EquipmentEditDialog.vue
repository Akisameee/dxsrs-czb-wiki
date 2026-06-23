<script setup lang="ts">
import EditableEnumField, { type EditableEnumOption } from "~/components/tools/save-edit/fields/EditableEnumField.vue";
import EditableNumberField from "~/components/tools/save-edit/fields/EditableNumberField.vue";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
} from "~/components/ui/dialog";
import CharacterEditDialogHeader from "../CharacterEditDialogHeader.vue";
import type { BgDatabaseField } from "~/lib/save-edit";

export type EquipmentEditField = {
  key: string;
  field: BgDatabaseField;
  value: string;
  initialValue: string;
  dirty: boolean;
  enumOptions: EditableEnumOption[];
};

type InscriptionRow = {
  id: number;
  name: string | null;
  legacy_name: string | null;
  style_id: number | null;
  bonus_value_min: number | null;
  bonus_value_max: number | null;
  fixed_strength: number;
  fixed_constitution: number;
  fixed_physique: number;
  fixed_agility: number;
};

const props = defineProps<{
  itemId?: number | string | null;
  itemName: string;
  legacyName?: string;
  uid: string;
  fields: EquipmentEditField[];
}>();

const emit = defineEmits<{
  updateField: [payload: { field: BgDatabaseField; value: string }];
}>();

const open = defineModel<boolean>("open", { required: true });
const { queryRows } = useWikiDb();
const weaponTypeIds = new Set([9, 10, 11, 12, 13, 14]);

const { data: inscriptions } = await useAsyncData(
  "save-edit-equipment-inscriptions",
  () => queryRows<InscriptionRow>(
    `SELECT id, name, legacy_name, style_id, bonus_value_min, bonus_value_max,
      fixed_strength, fixed_constitution, fixed_physique, fixed_agility
     FROM inscriptions
     ORDER BY id`,
  ),
  { server: false },
);

const typeId = computed(() => Number(equipmentField("type")?.value || equipmentField("type")?.initialValue || 0));
const isWeapon = computed(() => weaponTypeIds.has(typeId.value));
const hasBasicFields = computed(() => [
  "rare",
  "att",
  "def",
  "hp",
  "weight",
  "length",
].some((key) => Boolean(equipmentField(key))));
const hasBonusFields = computed(() => [
  "lvli",
  "gengu",
  "tipo",
  "shenfa",
].some((key) => Boolean(equipmentField(key))));
const hasEngravingFields = computed(() => [
  "mingkecitiao",
  "mingke_fg",
  "mingke_lvli",
  "mingke_gengu",
  "mingke_tipo",
  "mingke_shenfa",
].some((key) => Boolean(equipmentField(key))));
const inscriptionOptions = computed(() =>
  (inscriptions.value || [])
    .filter((row) => row.legacy_name)
    .map((row) => ({ value: row.legacy_name!, label: row.name || row.legacy_name! })),
);

function updateField(field: BgDatabaseField, value: string) {
  emit("updateField", { field, value });
}

function equipmentField(key: string) {
  return props.fields.find((field) => field.key === key) || null;
}

function fieldInput(field: EquipmentEditField | null) {
  if (!field) return "missing";
  if (field.key === "mingkecitiao" && inscriptionOptions.value.length) return "select";
  if ((field.key === "rare" || field.key === "mingke_fg") && field.enumOptions.length) return "select";
  if (["Int", "Float", "Long", "Enum"].includes(field.field.fieldType)) return "number";
  return "readonly";
}

function chainStyleOptions(field: EquipmentEditField) {
  return field.enumOptions.map((option) => option.value === "0"
    ? { ...option, label: "无铭刻" }
    : option);
}

function fieldEditProps(field: EquipmentEditField | null, transform: (value: string) => string = (value) => value) {
  const initialValue = transform(field?.initialValue ?? "");
  return {
    initialValue,
    modelValue: transform(field?.value ?? ""),
    dirty: Boolean(field?.dirty),
    resetValue: initialValue,
  };
}

function updateFieldByKey(key: string, value: string) {
  const field = equipmentField(key);
  if (field) updateField(field.field, value);
}

function inscriptionBonusValue(inscription: InscriptionRow) {
  return String(Math.round((Number(inscription.bonus_value_min || 0) + Number(inscription.bonus_value_max || 0)) / 2));
}

function inscriptionValue(value: string) {
  const inscription = (inscriptions.value || [])
    .find((row) => row.legacy_name === value || row.name === value);
  return inscription?.legacy_name || value;
}

function updateInscriptionType(value: string) {
  const inscription = (inscriptions.value || []).find((row) => row.legacy_name === value || row.name === value);
  updateFieldByKey("mingkecitiao", inscription?.legacy_name || value);
  if (!inscription) return;

  const bonusValue = inscriptionBonusValue(inscription);
  updateFieldByKey("mingke_fg", String(inscription.style_id || 0));
  updateFieldByKey("mingke_lvli", inscription.fixed_strength ? bonusValue : "0");
  updateFieldByKey("mingke_gengu", inscription.fixed_constitution ? bonusValue : "0");
  updateFieldByKey("mingke_tipo", inscription.fixed_physique ? bonusValue : "0");
  updateFieldByKey("mingke_shenfa", inscription.fixed_agility ? bonusValue : "0");
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl"
      @open-auto-focus.prevent
    >
      <CharacterEditDialogHeader
        kind="item"
        :id="itemId"
        :title="itemName"
        :legacy-name="legacyName"
        :uid="uid"
      />

      <div v-if="fields.length" class="grid auto-rows-min gap-5">
        <div v-if="hasBasicFields" class="grid gap-3">
          <div class="text-sm font-medium">基础属性</div>
          <div class="grid auto-rows-min gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <AppFieldStack v-if="equipmentField('rare')" label="品质">
              <EditableEnumField
                v-if="fieldInput(equipmentField('rare')) === 'select'"
                v-bind="fieldEditProps(equipmentField('rare'))"
                :options="equipmentField('rare')!.enumOptions"
                compact
                @update="updateField(equipmentField('rare')!.field, $event)"
              />
              <EditableNumberField
                v-else-if="fieldInput(equipmentField('rare')) === 'number'"
                v-bind="fieldEditProps(equipmentField('rare'))"
                compact
                @update="updateField(equipmentField('rare')!.field, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ equipmentField("rare")?.value || "-" }}
              </div>
            </AppFieldStack>

            <AppFieldStack v-if="equipmentField('att')" label="攻击">
              <EditableNumberField
                v-if="fieldInput(equipmentField('att')) === 'number'"
                v-bind="fieldEditProps(equipmentField('att'))"
                compact
                @update="updateField(equipmentField('att')!.field, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ equipmentField("att")?.value || "-" }}
              </div>
            </AppFieldStack>

            <AppFieldStack v-if="equipmentField('def')" label="防御">
              <EditableNumberField
                v-if="fieldInput(equipmentField('def')) === 'number'"
                v-bind="fieldEditProps(equipmentField('def'))"
                compact
                @update="updateField(equipmentField('def')!.field, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ equipmentField("def")?.value || "-" }}
              </div>
            </AppFieldStack>

            <AppFieldStack v-if="equipmentField('hp')" label="体力">
              <EditableNumberField
                v-if="fieldInput(equipmentField('hp')) === 'number'"
                v-bind="fieldEditProps(equipmentField('hp'))"
                compact
                @update="updateField(equipmentField('hp')!.field, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ equipmentField("hp")?.value || "-" }}
              </div>
            </AppFieldStack>

            <AppFieldStack v-if="equipmentField('weight')" label="重量">
              <EditableNumberField
                v-if="fieldInput(equipmentField('weight')) === 'number'"
                v-bind="fieldEditProps(equipmentField('weight'))"
                compact
                @update="updateField(equipmentField('weight')!.field, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ equipmentField("weight")?.value || "-" }}
              </div>
            </AppFieldStack>

            <AppFieldStack v-if="isWeapon && equipmentField('length')" label="攻击距离">
              <EditableNumberField
                v-if="fieldInput(equipmentField('length')) === 'number'"
                v-bind="fieldEditProps(equipmentField('length'))"
                compact
                @update="updateField(equipmentField('length')!.field, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ equipmentField("length")?.value || "-" }}
              </div>
            </AppFieldStack>
          </div>
        </div>

        <div v-if="hasBonusFields" class="grid gap-3">
          <div class="text-sm font-medium">附加属性</div>
          <div class="grid auto-rows-min gap-3 grid-cols-2 md:grid-cols-4">
            <AppFieldStack v-if="equipmentField('lvli')" label="膂力">
              <EditableNumberField
                v-bind="fieldEditProps(equipmentField('lvli'))"
                compact
                @update="updateField(equipmentField('lvli')!.field, $event)"
              />
            </AppFieldStack>
            <AppFieldStack v-if="equipmentField('gengu')" label="根骨">
              <EditableNumberField
                v-bind="fieldEditProps(equipmentField('gengu'))"
                compact
                @update="updateField(equipmentField('gengu')!.field, $event)"
              />
            </AppFieldStack>
            <AppFieldStack v-if="equipmentField('tipo')" label="体魄">
              <EditableNumberField
                v-bind="fieldEditProps(equipmentField('tipo'))"
                compact
                @update="updateField(equipmentField('tipo')!.field, $event)"
              />
            </AppFieldStack>
            <AppFieldStack v-if="equipmentField('shenfa')" label="身法">
              <EditableNumberField
                v-bind="fieldEditProps(equipmentField('shenfa'))"
                compact
                @update="updateField(equipmentField('shenfa')!.field, $event)"
              />
            </AppFieldStack>
          </div>
        </div>

        <div
          v-if="hasEngravingFields"
          class="grid gap-3"
        >
          <div class="text-sm font-medium">铭刻</div>
          <div class="grid auto-rows-min gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <AppFieldStack v-if="equipmentField('mingkecitiao')" label="铭刻类型">
              <EditableEnumField
                v-if="fieldInput(equipmentField('mingkecitiao')) === 'select'"
                v-bind="fieldEditProps(equipmentField('mingkecitiao'), inscriptionValue)"
                :options="inscriptionOptions"
                placeholder="选择铭刻"
                compact
                @update="updateInscriptionType"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ equipmentField("mingkecitiao")?.value || "-" }}
              </div>
            </AppFieldStack>

            <AppFieldStack v-if="equipmentField('mingke_fg')" label="铭刻风格">
              <EditableEnumField
                v-bind="fieldEditProps(equipmentField('mingke_fg'))"
                :options="chainStyleOptions(equipmentField('mingke_fg')!)"
                placeholder="选择风格"
                compact
                @update="updateField(equipmentField('mingke_fg')!.field, $event)"
              />
            </AppFieldStack>

            <AppFieldStack v-if="equipmentField('mingke_lvli')" label="铭刻膂力">
              <EditableNumberField
                v-bind="fieldEditProps(equipmentField('mingke_lvli'))"
                compact
                @update="updateField(equipmentField('mingke_lvli')!.field, $event)"
              />
            </AppFieldStack>
            <AppFieldStack v-if="equipmentField('mingke_gengu')" label="铭刻根骨">
              <EditableNumberField
                v-bind="fieldEditProps(equipmentField('mingke_gengu'))"
                compact
                @update="updateField(equipmentField('mingke_gengu')!.field, $event)"
              />
            </AppFieldStack>
            <AppFieldStack v-if="equipmentField('mingke_tipo')" label="铭刻体魄">
              <EditableNumberField
                v-bind="fieldEditProps(equipmentField('mingke_tipo'))"
                compact
                @update="updateField(equipmentField('mingke_tipo')!.field, $event)"
              />
            </AppFieldStack>
            <AppFieldStack v-if="equipmentField('mingke_shenfa')" label="铭刻身法">
              <EditableNumberField
                v-bind="fieldEditProps(equipmentField('mingke_shenfa'))"
                compact
                @update="updateField(equipmentField('mingke_shenfa')!.field, $event)"
              />
            </AppFieldStack>
          </div>
        </div>
      </div>

      <div v-else class="rounded-md border px-3 py-8 text-center text-sm text-muted-foreground">
        这个装备没有可编辑属性字段
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <AppButton type="button">完成</AppButton>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
