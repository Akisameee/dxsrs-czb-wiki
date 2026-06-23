<script setup lang="ts">
import EditableEnumField, { type EditableEnumOption } from "~/components/tools/save-edit/fields/EditableEnumField.vue";
import EditableNumberField from "~/components/tools/save-edit/fields/EditableNumberField.vue";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
} from "~/components/ui/dialog";
import MainEditDialogHeader from "../MainEditDialogHeader.vue";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { BgDatabaseField, SaveEditRowDraftTarget } from "~/lib/save-edit";
import { martialArtIsInternal } from "~/lib/wiki/martial-art";

export type MartialSaveField = {
  key: string;
  label: string;
  field: BgDatabaseField;
  target: SaveEditRowDraftTarget;
  rowIndex: number | null;
  value: string;
  initialValue: string;
  dirty: boolean;
  enumOptions: EditableEnumOption[];
};

export type MartialLevelRow = {
  level: number;
  fields: Record<string, MartialSaveField | null>;
};

const props = defineProps<{
  martialArtId?: number | string | null;
  title: string;
  description?: string;
  fields: MartialSaveField[];
  baseFields: MartialSaveField[];
  typeId: number | null;
  buffTargetsByEffect: Record<string, string>;
  levels: MartialLevelRow[];
}>();

const emit = defineEmits<{
  updateField: [payload: { field: BgDatabaseField; target: SaveEditRowDraftTarget; value: string }];
}>();

const open = defineModel<boolean>("open", { required: true });
const isInternal = computed(() => martialArtIsInternal({ type_id: props.typeId }));
const currentLevelValue = computed(() => Number(formField("currentlv")?.value));
const currentLevel = computed(() =>
  Number.isFinite(currentLevelValue.value)
    ? props.levels.find((level) => level.level === currentLevelValue.value) || null
    : null,
);

function updateField(field: MartialSaveField, value: string) {
  emit("updateField", { field: field.field, target: field.target, value });
}

function updateBuffField(slot: 1 | 2 | 3, field: MartialSaveField, value: string) {
  updateField(field, value);
  const target = baseField(`bufftarget${slot}`);
  const targetValue = props.buffTargetsByEffect[String(value)] ?? "1";
  if (target && target.value !== targetValue) updateField(target, targetValue);
}

function fieldInput(field: MartialSaveField | null) {
  if (!field) return "missing";
  if (field.enumOptions.length) return "select";
  if (["Int", "Float", "Long", "Enum"].includes(field.field.fieldType)) return "number";
  return "readonly";
}

function levelField(level: MartialLevelRow, key: string) {
  return level.fields[key] || null;
}

function currentLevelField(key: string) {
  const level = currentLevel.value;
  return level ? levelField(level, key) : null;
}

function formField(key: string) {
  return props.fields.find((field) => field.key === key) || null;
}

function baseField(key: string) {
  return props.baseFields.find((field) => field.key === key) || null;
}

function fieldEditProps(field: MartialSaveField | null) {
  const initialValue = field?.initialValue ?? "";
  return {
    initialValue,
    modelValue: field?.value ?? "",
    dirty: Boolean(field?.dirty),
    resetValue: initialValue,
  };
}

function chainStyleOptions(field: MartialSaveField) {
  return field.enumOptions.map((option) => option.value === "0"
    ? { ...option, label: "无连锁" }
    : option);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-6xl"
      @open-auto-focus.prevent
    >
      <MainEditDialogHeader
        kind="martial-art"
        :id="martialArtId"
        :title="title"
        :description="description"
      />

      <div class="grid gap-3">
        <div class="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div v-if="formField('currentlv')" class="flex items-center gap-2">
            <AppFieldStack class="flex-1" label="当前境界">
              <EditableNumberField
                v-bind="fieldEditProps(formField('currentlv'))"
                compact
                @update="updateField(formField('currentlv')!, $event)"
              />
            </AppFieldStack>
            <AppFieldStack class="flex-1" label="最高境界">
              <EditableNumberField
                v-bind="fieldEditProps(formField('maxlv'))"
                compact
                @update="updateField(formField('maxlv')!, $event)"
              />
            </AppFieldStack>
          </div>

          <AppFieldStack v-if="formField('liansuo_mp')" label="连锁门派">
            <EditableEnumField
              v-bind="fieldEditProps(formField('liansuo_mp'))"
              :options="formField('liansuo_mp')!.enumOptions"
              compact
              @update="updateField(formField('liansuo_mp')!, $event)"
            />
          </AppFieldStack>

          <AppFieldStack v-if="formField('liansuo_fg1')" label="连锁风格 1">
            <EditableEnumField
              v-bind="fieldEditProps(formField('liansuo_fg1'))"
              :options="chainStyleOptions(formField('liansuo_fg1')!)"
              compact
              @update="updateField(formField('liansuo_fg1')!, $event)"
            />
          </AppFieldStack>
          <AppFieldStack v-if="formField('liansuo_fg2')" label="连锁风格 2">
            <EditableEnumField
              v-bind="fieldEditProps(formField('liansuo_fg2'))"
              :options="chainStyleOptions(formField('liansuo_fg2')!)"
              compact
              @update="updateField(formField('liansuo_fg2')!, $event)"
            />
          </AppFieldStack>

          <AppFieldStack v-if="baseField('rare')" label="品质">
            <EditableEnumField
              v-if="fieldInput(baseField('rare')) === 'select'"
              v-bind="fieldEditProps(baseField('rare'))"
              :options="baseField('rare')!.enumOptions"
              compact
              @update="updateField(baseField('rare')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('rare')) === 'number'"
              v-bind="fieldEditProps(baseField('rare'))"
              compact
              @update="updateField(baseField('rare')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("rare")?.value || "-" }}
            </div>
          </AppFieldStack>

          <AppFieldStack v-if="!isInternal && currentLevelField('weili')" label="威力">
            <EditableNumberField
              v-if="fieldInput(currentLevelField('weili')) === 'number'"
              v-bind="fieldEditProps(currentLevelField('weili'))"
              compact
              @update="updateField(currentLevelField('weili')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ currentLevelField("weili")?.value || "-" }}
            </div>
          </AppFieldStack>

          <AppFieldStack v-if="isInternal && currentLevelField('hp')" label="体力">
            <EditableNumberField
              v-if="fieldInput(currentLevelField('hp')) === 'number'"
              v-bind="fieldEditProps(currentLevelField('hp'))"
              compact
              @update="updateField(currentLevelField('hp')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ currentLevelField("hp")?.value || "-" }}
            </div>
          </AppFieldStack>
          <AppFieldStack v-if="isInternal && currentLevelField('zhenqiup')" label="真气恢复">
            <EditableNumberField
              v-if="fieldInput(currentLevelField('zhenqiup')) === 'number'"
              v-bind="fieldEditProps(currentLevelField('zhenqiup'))"
              compact
              @update="updateField(currentLevelField('zhenqiup')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ currentLevelField("zhenqiup")?.value || "-" }}
            </div>
          </AppFieldStack>

          <AppFieldStack v-if="!isInternal && baseField('cost')" label="消耗真气">
            <EditableNumberField
              v-if="fieldInput(baseField('cost')) === 'number'"
              v-bind="fieldEditProps(baseField('cost'))"
              compact
              @update="updateField(baseField('cost')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("cost")?.value || "-" }}
            </div>
          </AppFieldStack>

          <AppFieldStack v-if="!isInternal && baseField('jiange')" label="间隔">
            <EditableNumberField
              v-if="fieldInput(baseField('jiange')) === 'number'"
              v-bind="fieldEditProps(baseField('jiange'))"
              compact
              @update="updateField(baseField('jiange')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("jiange")?.value || "-" }}
            </div>
          </AppFieldStack>

          <AppFieldStack v-if="!isInternal && baseField('mingzhong')" label="命中">
            <EditableNumberField
              v-if="fieldInput(baseField('mingzhong')) === 'number'"
              v-bind="fieldEditProps(baseField('mingzhong'))"
              compact
              @update="updateField(baseField('mingzhong')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("mingzhong")?.value || "-" }}
            </div>
          </AppFieldStack>

          <AppFieldStack v-if="!isInternal && baseField('slashfx')" label="出招特效">
            <EditableEnumField
              v-if="fieldInput(baseField('slashfx')) === 'select'"
              v-bind="fieldEditProps(baseField('slashfx'))"
              :options="baseField('slashfx')!.enumOptions"
              compact
              @update="updateField(baseField('slashfx')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('slashfx')) === 'number'"
              v-bind="fieldEditProps(baseField('slashfx'))"
              compact
              @update="updateField(baseField('slashfx')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("slashfx")?.value || "-" }}
            </div>
          </AppFieldStack>

          <AppFieldStack v-if="!isInternal && baseField('hitfx')" label="命中特效">
            <EditableEnumField
              v-if="fieldInput(baseField('hitfx')) === 'select'"
              v-bind="fieldEditProps(baseField('hitfx'))"
              :options="baseField('hitfx')!.enumOptions"
              compact
              @update="updateField(baseField('hitfx')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('hitfx')) === 'number'"
              v-bind="fieldEditProps(baseField('hitfx'))"
              compact
              @update="updateField(baseField('hitfx')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("hitfx")?.value || "-" }}
            </div>
          </AppFieldStack>
        </div>

        <div v-if="!isInternal" class="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div v-if="baseField('buff1')" class="flex items-center gap-2">
            <AppFieldStack class="flex-1" label="特殊效果 1">
              <EditableEnumField
                v-if="fieldInput(baseField('buff1')) === 'select'"
                v-bind="fieldEditProps(baseField('buff1'))"
                :options="baseField('buff1')!.enumOptions"
                compact
                @update="updateBuffField(1, baseField('buff1')!, $event)"
              />
              <EditableNumberField
                v-else-if="fieldInput(baseField('buff1')) === 'number'"
                v-bind="fieldEditProps(baseField('buff1'))"
                compact
                @update="updateBuffField(1, baseField('buff1')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ baseField("buff1")?.value || "-" }}
              </div>
            </AppFieldStack>
            <AppFieldStack v-if="currentLevelField('b1value')" class="flex-1" label="等级">
              <EditableNumberField
                v-if="fieldInput(currentLevelField('b1value')) === 'number'"
                v-bind="fieldEditProps(currentLevelField('b1value'))"
                compact
                @update="updateField(currentLevelField('b1value')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ currentLevelField("b1value")?.value || "-" }}
              </div>
            </AppFieldStack>
          </div>
          <div v-if="baseField('buff2')" class="flex items-center gap-2">
            <AppFieldStack class="flex-1" label="特殊效果 2">
              <EditableEnumField
                v-if="fieldInput(baseField('buff2')) === 'select'"
                v-bind="fieldEditProps(baseField('buff2'))"
                :options="baseField('buff2')!.enumOptions"
                compact
                @update="updateBuffField(2, baseField('buff2')!, $event)"
              />
              <EditableNumberField
                v-else-if="fieldInput(baseField('buff2')) === 'number'"
                v-bind="fieldEditProps(baseField('buff2'))"
                compact
                @update="updateBuffField(2, baseField('buff2')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ baseField("buff2")?.value || "-" }}
              </div>
            </AppFieldStack>
            <AppFieldStack v-if="currentLevelField('b2value')" class="flex-1" label="等级">
              <EditableNumberField
                v-if="fieldInput(currentLevelField('b2value')) === 'number'"
                v-bind="fieldEditProps(currentLevelField('b2value'))"
                compact
                @update="updateField(currentLevelField('b2value')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ currentLevelField("b2value")?.value || "-" }}
              </div>
            </AppFieldStack>
          </div>
          <div v-if="baseField('buff3')" class="flex items-center gap-2">
            <AppFieldStack class="flex-1" label="特殊效果 3">
              <EditableEnumField
                v-if="fieldInput(baseField('buff3')) === 'select'"
                v-bind="fieldEditProps(baseField('buff3'))"
                :options="baseField('buff3')!.enumOptions"
                compact
                @update="updateBuffField(3, baseField('buff3')!, $event)"
              />
              <EditableNumberField
                v-else-if="fieldInput(baseField('buff3')) === 'number'"
                v-bind="fieldEditProps(baseField('buff3'))"
                compact
                @update="updateBuffField(3, baseField('buff3')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ baseField("buff3")?.value || "-" }}
              </div>
            </AppFieldStack>
            <AppFieldStack v-if="currentLevelField('b3value')" class="flex-1" label="等级">
              <EditableNumberField
                v-if="fieldInput(currentLevelField('b3value')) === 'number'"
                v-bind="fieldEditProps(currentLevelField('b3value'))"
                compact
                @update="updateField(currentLevelField('b3value')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ currentLevelField("b3value")?.value || "-" }}
              </div>
            </AppFieldStack>
          </div>
        </div>

        <div v-if="isInternal" class="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div v-if="baseField('beidong1')" class="flex items-center gap-2">
            <AppFieldStack class="flex-1" label="被动 1">
              <EditableEnumField
                v-if="fieldInput(baseField('beidong1')) === 'select'"
                v-bind="fieldEditProps(baseField('beidong1'))"
                :options="baseField('beidong1')!.enumOptions"
                compact
                @update="updateField(baseField('beidong1')!, $event)"
              />
              <EditableNumberField
                v-else-if="fieldInput(baseField('beidong1')) === 'number'"
                v-bind="fieldEditProps(baseField('beidong1'))"
                compact
                @update="updateField(baseField('beidong1')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ baseField("beidong1")?.value || "-" }}
              </div>
            </AppFieldStack>
            <AppFieldStack v-if="currentLevelField('b1value')" class="flex-1" label="数值">
              <EditableNumberField
                v-if="fieldInput(currentLevelField('b1value')) === 'number'"
                v-bind="fieldEditProps(currentLevelField('b1value'))"
                compact
                @update="updateField(currentLevelField('b1value')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ currentLevelField("b1value")?.value || "-" }}
              </div>
            </AppFieldStack>
          </div>
          <div v-if="baseField('beidong2')" class="flex items-center gap-2">
            <AppFieldStack class="flex-1" label="被动 2">
              <EditableEnumField
                v-if="fieldInput(baseField('beidong2')) === 'select'"
                v-bind="fieldEditProps(baseField('beidong2'))"
                :options="baseField('beidong2')!.enumOptions"
                compact
                @update="updateField(baseField('beidong2')!, $event)"
              />
              <EditableNumberField
                v-else-if="fieldInput(baseField('beidong2')) === 'number'"
                v-bind="fieldEditProps(baseField('beidong2'))"
                compact
                @update="updateField(baseField('beidong2')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ baseField("beidong2")?.value || "-" }}
              </div>
            </AppFieldStack>
            <AppFieldStack v-if="currentLevelField('b2value')" class="flex-1" label="数值">
              <EditableNumberField
                v-if="fieldInput(currentLevelField('b2value')) === 'number'"
                v-bind="fieldEditProps(currentLevelField('b2value'))"
                compact
                @update="updateField(currentLevelField('b2value')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ currentLevelField("b2value")?.value || "-" }}
              </div>
            </AppFieldStack>
          </div>
          <div v-if="baseField('beidong3')" class="flex items-center gap-2">
            <AppFieldStack class="flex-1" label="被动 3">
              <EditableEnumField
                v-if="fieldInput(baseField('beidong3')) === 'select'"
                v-bind="fieldEditProps(baseField('beidong3'))"
                :options="baseField('beidong3')!.enumOptions"
                compact
                @update="updateField(baseField('beidong3')!, $event)"
              />
              <EditableNumberField
                v-else-if="fieldInput(baseField('beidong3')) === 'number'"
                v-bind="fieldEditProps(baseField('beidong3'))"
                compact
                @update="updateField(baseField('beidong3')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ baseField("beidong3")?.value || "-" }}
              </div>
            </AppFieldStack>
            <AppFieldStack v-if="currentLevelField('b3value')" class="flex-1" label="数值">
              <EditableNumberField
                v-if="fieldInput(currentLevelField('b3value')) === 'number'"
                v-bind="fieldEditProps(currentLevelField('b3value'))"
                compact
                @update="updateField(currentLevelField('b3value')!, $event)"
              />
              <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {{ currentLevelField("b3value")?.value || "-" }}
              </div>
            </AppFieldStack>
          </div>
        </div>
      </div>

      <div class="overflow-auto">
        <Table class="[&_td]:min-w-24 [&_td]:text-center [&_th]:min-w-24 [&_th]:whitespace-nowrap [&_th]:text-center">
          <TableHeader>
            <TableRow>
              <TableHead rowspan="2">境界</TableHead>
              <TableHead rowspan="2">威力</TableHead>
              <TableHead rowspan="2">体力</TableHead>
              <TableHead rowspan="2">真气恢复</TableHead>
              <TableHead rowspan="2">修炼经验</TableHead>
              <TableHead colspan="5" class="text-center">属性加成</TableHead>
              <TableHead v-if="isInternal" colspan="3" class="text-center">被动数值</TableHead>
              <TableHead v-else colspan="3" class="text-center">效果等级</TableHead>
            </TableRow>
            <TableRow>
              <TableHead>膂力</TableHead>
              <TableHead>根骨</TableHead>
              <TableHead>体魄</TableHead>
              <TableHead>身法</TableHead>
              <TableHead>武艺</TableHead>
              <TableHead>1</TableHead>
              <TableHead>2</TableHead>
              <TableHead>3</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="level in levels"
              :key="level.level"
            >
              <TableCell class="whitespace-nowrap">第 {{ level.level }} 重</TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'weili')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'weili'))"
                  compact
                  @update="updateField(levelField(level, 'weili')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "weili")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'hp')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'hp'))"
                  compact
                  @update="updateField(levelField(level, 'hp')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "hp")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'zhenqiup')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'zhenqiup'))"
                  compact
                  @update="updateField(levelField(level, 'zhenqiup')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "zhenqiup")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'maxexp')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'maxexp'))"
                  compact
                  @update="updateField(levelField(level, 'maxexp')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "maxexp")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'xiulian_lvli')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'xiulian_lvli'))"
                  compact
                  @update="updateField(levelField(level, 'xiulian_lvli')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "xiulian_lvli")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'xiulian_gengu')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'xiulian_gengu'))"
                  compact
                  @update="updateField(levelField(level, 'xiulian_gengu')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "xiulian_gengu")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'xiulian_tipo')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'xiulian_tipo'))"
                  compact
                  @update="updateField(levelField(level, 'xiulian_tipo')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "xiulian_tipo")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'xiulian_shenfa')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'xiulian_shenfa'))"
                  compact
                  @update="updateField(levelField(level, 'xiulian_shenfa')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "xiulian_shenfa")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'xiulian_wuyi')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'xiulian_wuyi'))"
                  compact
                  @update="updateField(levelField(level, 'xiulian_wuyi')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "xiulian_wuyi")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'b1value')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'b1value'))"
                  compact
                  @update="updateField(levelField(level, 'b1value')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "b1value")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'b2value')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'b2value'))"
                  compact
                  @update="updateField(levelField(level, 'b2value')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "b2value")?.value || "-" }}
                </div>
              </TableCell>
              <TableCell>
                <EditableNumberField
                  v-if="fieldInput(levelField(level, 'b3value')) === 'number'"
                  v-bind="fieldEditProps(levelField(level, 'b3value'))"
                  compact
                  @update="updateField(levelField(level, 'b3value')!, $event)"
                />
                <div v-else class="h-9 min-w-20 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {{ levelField(level, "b3value")?.value || "-" }}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <AppButton type="button">完成</AppButton>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
