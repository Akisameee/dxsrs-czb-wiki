<script setup lang="ts">
import { useMediaQuery } from "@vueuse/core";
import type { SelectableMartialArt } from "./types";
import MartialArtCard from "~/components/wiki/martial-art/Card.vue";
import WikiCardGrid from "~/components/wiki/WikiCardGrid.vue";

const props = defineProps<{
  errorMessage: string;
  rows: SelectableMartialArt[];
  isSelected: (item: SelectableMartialArt) => boolean;
  canSelect: (item: SelectableMartialArt) => boolean;
  disabledReason: (item: SelectableMartialArt) => string;
}>();

const emit = defineEmits<{
  toggleMartialArt: [item: SelectableMartialArt, checked?: boolean];
}>();

const currentPage = ref(1);
const isSm = useMediaQuery("(min-width: 640px)");
const isLg = useMediaQuery("(min-width: 1024px)");
const gridColumns = computed(() => {
  if (isLg.value) return 3;
  if (isSm.value) return 2;
  return 1;
});
const pageSize = computed(() => gridColumns.value * (gridColumns.value === 1 ? 10 : 6));
const pageCount = computed(() => Math.max(1, Math.ceil(props.rows.length / pageSize.value)));
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return props.rows.slice(start, start + pageSize.value);
});

watch(() => props.rows, () => {
  currentPage.value = 1;
});

watch(pageSize, (size, oldSize) => {
  if (!oldSize) return;
  const firstVisibleIndex = (currentPage.value - 1) * oldSize;
  currentPage.value = Math.floor(firstVisibleIndex / size) + 1;
});

watch(pageCount, (count) => {
  if (currentPage.value > count) currentPage.value = count;
});

function styleRows(item: SelectableMartialArt) {
  return item.styles.map((label, index) => ({
    id: item.styleIds[index],
    label,
  }));
}
</script>

<template>
  <WikiCardGrid
    v-model:page="currentPage"
    :error="errorMessage"
    :rows="pagedRows"
    :total="rows.length"
    :page-size="pageSize"
    empty-label="没有匹配的武学"
    grid-class="xl:grid-cols-3"
  >
    <MartialArtCard
      v-for="item in pagedRows"
      :key="item.id"
      role="button"
      :id="item.id"
      :name="item.name"
      :type="item.type"
      :type-id="item.typeId"
      :rarity-id="item.rare"
      :rarity-tone-id="item.rarityToneId"
      :sect-id="item.sectId"
      :sect-label="item.sect"
      :styles="styleRows(item)"
      :selected="isSelected(item)"
      :disabled="!canSelect(item)"
      :title-attr="disabledReason(item) || item.name"
      :interactive-badges="false"
      :on-click="() => emit('toggleMartialArt', item)"
    />
  </WikiCardGrid>
</template>
