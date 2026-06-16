<script setup lang="ts">
import EditableEnumField, { type EditableEnumOption } from "~/components/tools/save-edit/fields/EditableEnumField.vue";
import EditableNumberField from "~/components/tools/save-edit/fields/EditableNumberField.vue";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { BgDatabaseField } from "~/lib/save-edit";
import { martialArtIsInternal } from "~/lib/wiki/martial-art";

export type MartialSaveField = {
  key: string;
  label: string;
  field: BgDatabaseField;
  rowIndex: number;
  value: string;
  initialValue: string;
  enumOptions: EditableEnumOption[];
};

export type MartialLevelRow = {
  level: number;
  fields: Record<string, MartialSaveField | null>;
};

const props = defineProps<{
  title: string;
  description?: string;
  fields: MartialSaveField[];
  baseFields: MartialSaveField[];
  typeId: number | null;
  buffTargetsByEffect: Record<string, string>;
  levels: MartialLevelRow[];
}>();

const emit = defineEmits<{
  updateField: [payload: { field: BgDatabaseField; rowIndex: number; value: string }];
}>();

const open = defineModel<boolean>("open", { required: true });
const isInternal = computed(() => martialArtIsInternal({ type_id: props.typeId }));

function updateField(field: MartialSaveField, value: string) {
  emit("updateField", { field: field.field, rowIndex: field.rowIndex, value });
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

function formField(key: string) {
  return props.fields.find((field) => field.key === key) || null;
}

function baseField(key: string) {
  return props.baseFields.find((field) => field.key === key) || null;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-6xl">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription v-if="description">
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-3">
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div v-if="formField('currentlv')" class="grid gap-1.5">
            <Label>当前境界 / 最高境界</Label>
            <div class="flex items-center gap-2">
              <EditableNumberField
                :initial-value="formField('currentlv')!.initialValue"
                :model-value="formField('currentlv')!.value"
                compact
                @update="updateField(formField('currentlv')!, $event)"
              />
              <EditableNumberField
                :initial-value="formField('maxlv')!.initialValue"
                :model-value="formField('maxlv')!.value"
                compact
                @update="updateField(formField('maxlv')!, $event)"
              />
            </div>
          </div>
          <div v-if="formField('liansuo_mp')" class="grid gap-1.5">
            <Label>连锁门派</Label>
            <EditableEnumField
              :initial-value="formField('liansuo_mp')!.initialValue"
              :model-value="formField('liansuo_mp')!.value"
              :options="formField('liansuo_mp')!.enumOptions"
              compact
              @update="updateField(formField('liansuo_mp')!, $event)"
            />
          </div>
          <div v-if="formField('liansuo_fg1')" class="grid gap-1.5">
            <Label>连锁风格 1</Label>
            <EditableEnumField
              :initial-value="formField('liansuo_fg1')!.initialValue"
              :model-value="formField('liansuo_fg1')!.value"
              :options="formField('liansuo_fg1')!.enumOptions"
              compact
              @update="updateField(formField('liansuo_fg1')!, $event)"
            />
          </div>
          <div v-if="formField('liansuo_fg2')" class="grid gap-1.5">
            <Label>连锁风格 2</Label>
            <EditableEnumField
              :initial-value="formField('liansuo_fg2')!.initialValue"
              :model-value="formField('liansuo_fg2')!.value"
              :options="formField('liansuo_fg2')!.enumOptions"
              compact
              @update="updateField(formField('liansuo_fg2')!, $event)"
            />
          </div>
          <div v-if="baseField('rare')" class="grid gap-1.5">
            <Label>品质</Label>
            <EditableEnumField
              v-if="fieldInput(baseField('rare')) === 'select'"
              :initial-value="baseField('rare')!.initialValue"
              :model-value="baseField('rare')!.value"
              :options="baseField('rare')!.enumOptions"
              compact
              @update="updateField(baseField('rare')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('rare')) === 'number'"
              :initial-value="baseField('rare')!.initialValue"
              :model-value="baseField('rare')!.value"
              compact
              @update="updateField(baseField('rare')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("rare")?.value || "-" }}
            </div>
          </div>

          <div v-if="!isInternal && baseField('cost')" class="grid gap-1.5">
            <Label>消耗</Label>
            <EditableNumberField
              v-if="fieldInput(baseField('cost')) === 'number'"
              :initial-value="baseField('cost')!.initialValue"
              :model-value="baseField('cost')!.value"
              compact
              @update="updateField(baseField('cost')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("cost")?.value || "-" }}
            </div>
          </div>

          <div v-if="!isInternal && baseField('jiange')" class="grid gap-1.5">
            <Label>间隔</Label>
            <EditableNumberField
              v-if="fieldInput(baseField('jiange')) === 'number'"
              :initial-value="baseField('jiange')!.initialValue"
              :model-value="baseField('jiange')!.value"
              compact
              @update="updateField(baseField('jiange')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("jiange")?.value || "-" }}
            </div>
          </div>

          <div v-if="!isInternal && baseField('mingzhong')" class="grid gap-1.5">
            <Label>命中</Label>
            <EditableNumberField
              v-if="fieldInput(baseField('mingzhong')) === 'number'"
              :initial-value="baseField('mingzhong')!.initialValue"
              :model-value="baseField('mingzhong')!.value"
              compact
              @update="updateField(baseField('mingzhong')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("mingzhong")?.value || "-" }}
            </div>
          </div>

          <div v-if="!isInternal && baseField('slashfx')" class="grid gap-1.5">
            <Label>出招特效</Label>
            <EditableEnumField
              v-if="fieldInput(baseField('slashfx')) === 'select'"
              :initial-value="baseField('slashfx')!.initialValue"
              :model-value="baseField('slashfx')!.value"
              :options="baseField('slashfx')!.enumOptions"
              compact
              @update="updateField(baseField('slashfx')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('slashfx')) === 'number'"
              :initial-value="baseField('slashfx')!.initialValue"
              :model-value="baseField('slashfx')!.value"
              compact
              @update="updateField(baseField('slashfx')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("slashfx")?.value || "-" }}
            </div>
          </div>

          <div v-if="!isInternal && baseField('hitfx')" class="grid gap-1.5">
            <Label>命中特效</Label>
            <EditableEnumField
              v-if="fieldInput(baseField('hitfx')) === 'select'"
              :initial-value="baseField('hitfx')!.initialValue"
              :model-value="baseField('hitfx')!.value"
              :options="baseField('hitfx')!.enumOptions"
              compact
              @update="updateField(baseField('hitfx')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('hitfx')) === 'number'"
              :initial-value="baseField('hitfx')!.initialValue"
              :model-value="baseField('hitfx')!.value"
              compact
              @update="updateField(baseField('hitfx')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("hitfx")?.value || "-" }}
            </div>
          </div>
        </div>

        <div v-if="!isInternal" class="grid gap-3 lg:grid-cols-3">
          <div v-if="baseField('buff1')" class="grid gap-1.5">
            <Label>效果 1</Label>
            <EditableEnumField
              v-if="fieldInput(baseField('buff1')) === 'select'"
              :initial-value="baseField('buff1')!.initialValue"
              :model-value="baseField('buff1')!.value"
              :options="baseField('buff1')!.enumOptions"
              compact
              @update="updateBuffField(1, baseField('buff1')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('buff1')) === 'number'"
              :initial-value="baseField('buff1')!.initialValue"
              :model-value="baseField('buff1')!.value"
              compact
              @update="updateBuffField(1, baseField('buff1')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("buff1")?.value || "-" }}
            </div>
          </div>
          <div v-if="baseField('buff2')" class="grid gap-1.5">
            <Label>效果 2</Label>
            <EditableEnumField
              v-if="fieldInput(baseField('buff2')) === 'select'"
              :initial-value="baseField('buff2')!.initialValue"
              :model-value="baseField('buff2')!.value"
              :options="baseField('buff2')!.enumOptions"
              compact
              @update="updateBuffField(2, baseField('buff2')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('buff2')) === 'number'"
              :initial-value="baseField('buff2')!.initialValue"
              :model-value="baseField('buff2')!.value"
              compact
              @update="updateBuffField(2, baseField('buff2')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("buff2")?.value || "-" }}
            </div>
          </div>
          <div v-if="baseField('buff3')" class="grid gap-1.5">
            <Label>效果 3</Label>
            <EditableEnumField
              v-if="fieldInput(baseField('buff3')) === 'select'"
              :initial-value="baseField('buff3')!.initialValue"
              :model-value="baseField('buff3')!.value"
              :options="baseField('buff3')!.enumOptions"
              compact
              @update="updateBuffField(3, baseField('buff3')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('buff3')) === 'number'"
              :initial-value="baseField('buff3')!.initialValue"
              :model-value="baseField('buff3')!.value"
              compact
              @update="updateBuffField(3, baseField('buff3')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("buff3")?.value || "-" }}
            </div>
          </div>
        </div>

        <div v-if="isInternal" class="grid gap-3 sm:grid-cols-3">
          <div v-if="baseField('beidong1')" class="grid gap-1.5">
            <Label>被动 1</Label>
            <EditableEnumField
              v-if="fieldInput(baseField('beidong1')) === 'select'"
              :initial-value="baseField('beidong1')!.initialValue"
              :model-value="baseField('beidong1')!.value"
              :options="baseField('beidong1')!.enumOptions"
              compact
              @update="updateField(baseField('beidong1')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('beidong1')) === 'number'"
              :initial-value="baseField('beidong1')!.initialValue"
              :model-value="baseField('beidong1')!.value"
              compact
              @update="updateField(baseField('beidong1')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("beidong1")?.value || "-" }}
            </div>
          </div>
          <div v-if="baseField('beidong2')" class="grid gap-1.5">
            <Label>被动 2</Label>
            <EditableEnumField
              v-if="fieldInput(baseField('beidong2')) === 'select'"
              :initial-value="baseField('beidong2')!.initialValue"
              :model-value="baseField('beidong2')!.value"
              :options="baseField('beidong2')!.enumOptions"
              compact
              @update="updateField(baseField('beidong2')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('beidong2')) === 'number'"
              :initial-value="baseField('beidong2')!.initialValue"
              :model-value="baseField('beidong2')!.value"
              compact
              @update="updateField(baseField('beidong2')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("beidong2")?.value || "-" }}
            </div>
          </div>
          <div v-if="baseField('beidong3')" class="grid gap-1.5">
            <Label>被动 3</Label>
            <EditableEnumField
              v-if="fieldInput(baseField('beidong3')) === 'select'"
              :initial-value="baseField('beidong3')!.initialValue"
              :model-value="baseField('beidong3')!.value"
              :options="baseField('beidong3')!.enumOptions"
              compact
              @update="updateField(baseField('beidong3')!, $event)"
            />
            <EditableNumberField
              v-else-if="fieldInput(baseField('beidong3')) === 'number'"
              :initial-value="baseField('beidong3')!.initialValue"
              :model-value="baseField('beidong3')!.value"
              compact
              @update="updateField(baseField('beidong3')!, $event)"
            />
            <div v-else class="h-9 truncate rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {{ baseField("beidong3")?.value || "-" }}
            </div>
          </div>
        </div>
      </div>

      <div class="overflow-auto">
        <Table class="[&_td]:text-center [&_th]:text-center">
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
                  :initial-value="levelField(level, 'weili')!.initialValue"
                  :model-value="levelField(level, 'weili')!.value"
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
                  :initial-value="levelField(level, 'hp')!.initialValue"
                  :model-value="levelField(level, 'hp')!.value"
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
                  :initial-value="levelField(level, 'zhenqiup')!.initialValue"
                  :model-value="levelField(level, 'zhenqiup')!.value"
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
                  :initial-value="levelField(level, 'maxexp')!.initialValue"
                  :model-value="levelField(level, 'maxexp')!.value"
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
                  :initial-value="levelField(level, 'xiulian_lvli')!.initialValue"
                  :model-value="levelField(level, 'xiulian_lvli')!.value"
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
                  :initial-value="levelField(level, 'xiulian_gengu')!.initialValue"
                  :model-value="levelField(level, 'xiulian_gengu')!.value"
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
                  :initial-value="levelField(level, 'xiulian_tipo')!.initialValue"
                  :model-value="levelField(level, 'xiulian_tipo')!.value"
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
                  :initial-value="levelField(level, 'xiulian_shenfa')!.initialValue"
                  :model-value="levelField(level, 'xiulian_shenfa')!.value"
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
                  :initial-value="levelField(level, 'xiulian_wuyi')!.initialValue"
                  :model-value="levelField(level, 'xiulian_wuyi')!.value"
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
                  :initial-value="levelField(level, 'b1value')!.initialValue"
                  :model-value="levelField(level, 'b1value')!.value"
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
                  :initial-value="levelField(level, 'b2value')!.initialValue"
                  :model-value="levelField(level, 'b2value')!.value"
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
                  :initial-value="levelField(level, 'b3value')!.initialValue"
                  :model-value="levelField(level, 'b3value')!.value"
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
