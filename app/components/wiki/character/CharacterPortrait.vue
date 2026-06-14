<script lang="ts">
import type { ComposedGameImage } from "~/composables/useGameImageAtlas";

export type CharacterPortraitIds = {
  characterId?: number | string | null;
  portrait?: string | null;
};

const portraitCache = new Map<string, Promise<ComposedGameImage | null>>();
</script>

<script setup lang="ts">
import type { GameImageLayer } from "~/composables/useGameImageAtlas";
import { cn } from "~/lib/utils";

type PortraitLayerRow = {
  slot: string;
  sort_order: number;
  image_id: string | null;
  color_a: number;
  active: number;
};

const props = withDefaults(defineProps<{
  ids: CharacterPortraitIds;
  fallback?: string;
  size?: number;
  class?: string;
}>(), {
  fallback: "",
  size: 96,
});

const { queryOne, queryRows } = useWikiDb();
const { composeImageLayers, pending: atlasPending } = useGameImageAtlas();
const image = shallowRef<ComposedGameImage | null>(null);
const loading = ref(false);

const resolvedPortrait = computed(() => props.ids.portrait || null);
const characterId = computed(() => {
  const id = Number(props.ids.characterId);
  return Number.isFinite(id) ? id : null;
});

async function loadPortraitName() {
  if (resolvedPortrait.value) return resolvedPortrait.value;
  if (characterId.value === null) return null;

  const row = await queryOne<{ portrait: string | null }>(
    "SELECT portrait FROM characters WHERE id = ?",
    [characterId.value],
  );
  return row?.portrait || null;
}

async function loadPresetPortrait(portrait: string) {
  const cacheKey = `preset:${portrait}`;
  if (!portraitCache.has(cacheKey)) {
    portraitCache.set(cacheKey, (async () => {
      const rows = await queryRows<PortraitLayerRow>(
        `SELECT slot, sort_order, image_id, color_a, active
         FROM portrait_prefab_layers
         WHERE portrait = ?
           AND active = 1
           AND image_id IS NOT NULL
         ORDER BY sort_order, slot`,
        [portrait],
      );

      const layers: GameImageLayer[] = rows.map((row) => ({
        imageId: row.image_id,
        opacity: row.color_a,
      }));

      return composeImageLayers(layers);
    })());
  }

  return portraitCache.get(cacheKey)!;
}

watch(
  [() => props.ids, atlasPending],
  async () => {
    if (atlasPending.value) return;

    const requestKey = JSON.stringify(props.ids);
    loading.value = true;
    image.value = null;

    try {
      const portrait = await loadPortraitName();
      const nextImage = portrait ? await loadPresetPortrait(portrait) : null;
      if (requestKey === JSON.stringify(props.ids)) image.value = nextImage;
    } finally {
      if (requestKey === JSON.stringify(props.ids)) loading.value = false;
    }
  },
  { deep: true, immediate: true },
);

const rootStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));
</script>

<template>
  <span
    :class="cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/20 text-muted-foreground', props.class)"
    :style="rootStyle"
  >
    <img
      v-if="image"
      :src="image.src"
      :alt="fallback"
      class="size-full object-contain"
      draggable="false"
    >
    <span v-else class="text-sm font-medium">
      {{ loading ? "" : fallback }}
    </span>
  </span>
</template>
