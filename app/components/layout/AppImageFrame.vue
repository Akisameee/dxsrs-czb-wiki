<script setup lang="ts">
import type { HTMLAttributes, StyleValue } from "vue";
import { cn } from "~/lib/utils";

const props = withDefaults(defineProps<{
  class?: HTMLAttributes["class"];
  style?: StyleValue;
  fallback?: string;
  ariaLabel?: string;
  role?: string;
  eager?: boolean;
  rootMargin?: string;
  measure?: boolean;
}>(), {
  fallback: "",
  ariaLabel: "",
  role: "",
  eager: false,
  rootMargin: "200px",
  measure: true,
});

const active = defineModel<boolean>("active", { default: false });
const measuredSize = defineModel<number>("measuredSize", { default: 0 });
const root = ref<HTMLElement | null>(null);
let intersectionObserver: IntersectionObserver | null = null;
let resizeObserver: ResizeObserver | null = null;

function activate() {
  active.value = true;
  intersectionObserver?.disconnect();
  intersectionObserver = null;
}

onMounted(() => {
  if (props.measure && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width;
      if (width && Number.isFinite(width)) measuredSize.value = width;
    });
    if (root.value) resizeObserver.observe(root.value);
  }

  if (props.eager || typeof IntersectionObserver === "undefined") {
    activate();
    return;
  }

  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) activate();
    },
    { rootMargin: props.rootMargin },
  );
  if (root.value) intersectionObserver.observe(root.value);
});

onBeforeUnmount(() => {
  intersectionObserver?.disconnect();
  resizeObserver?.disconnect();
});
</script>

<template>
  <span
    ref="root"
    :role="role || undefined"
    :aria-label="ariaLabel || undefined"
    :aria-hidden="ariaLabel || fallback ? undefined : true"
    :class="cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden', props.class)"
    :style="props.style"
  >
    <slot v-if="active" :active="active" :measured-size="measuredSize" />
    <slot v-else name="fallback" :active="active" :measured-size="measuredSize">
      {{ fallback }}
    </slot>
  </span>
</template>
