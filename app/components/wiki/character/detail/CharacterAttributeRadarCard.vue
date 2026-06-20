<script setup lang="ts">
import type { CharacterDetailRow } from "~/composables/useCharacterData";

const props = defineProps<{
  character: CharacterDetailRow;
}>();

const radarCanvas = ref<HTMLCanvasElement | null>(null);
let radarChart: any = null;

const attributeStats = computed(() => [
  { key: "strength", label: "膂力", value: props.character.strength },
  { key: "physique", label: "体魄", value: props.character.physique },
  { key: "agility", label: "身法", value: props.character.agility },
  { key: "constitution", label: "根骨", value: props.character.constitution },
]);

const radarMax = computed(() => Math.max(1000, ...attributeStats.value.map((item) => Number(item.value) || 0)));

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return String(Math.round(Number(value)));
}

function themeColor(name: string, fallback: string) {
  if (!import.meta.client) return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

async function renderRadarChart() {
  if (!import.meta.client || !radarCanvas.value || !attributeStats.value.length) return;
  const {
    Chart,
    Filler,
    Legend,
    LineElement,
    PointElement,
    RadarController,
    RadialLinearScale,
    Tooltip,
  } = await import("chart.js");

  Chart.register(Filler, Legend, LineElement, PointElement, RadarController, RadialLinearScale, Tooltip);
  radarChart?.destroy();
  radarChart = new Chart(radarCanvas.value, {
    type: "radar",
    data: {
      labels: attributeStats.value.map((item) => item.label),
      datasets: [{
        data: attributeStats.value.map((item) => Math.round(Number(item.value) || 0)),
        backgroundColor: "rgba(20, 184, 166, 0.22)",
        borderColor: themeColor("--primary", "#0f172a"),
        borderWidth: 0.5,
        pointBackgroundColor: themeColor("--primary", "#0f172a"),
        pointRadius: 2,
      }],
    },
    options: {
      animation: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: radarMax.value,
          ticks: { display: false, stepSize: Math.max(1, Math.ceil(radarMax.value / 4)) },
          grid: { color: themeColor("--border", "#e5e7eb") },
          angleLines: { color: themeColor("--border", "#e5e7eb") },
          pointLabels: {
            color: themeColor("--foreground", "#111827"),
            font: { size: 13, weight: 400 },
          },
        },
      },
    },
  });
}

watch([attributeStats, radarMax], () => {
  void nextTick(renderRadarChart);
}, { deep: true });

onMounted(() => {
  void nextTick(renderRadarChart);
});

onBeforeUnmount(() => {
  radarChart?.destroy();
});
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>四维数值</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid min-w-0 gap-6 overflow-hidden text-sm md:grid-cols-[minmax(9rem,12rem)_minmax(0,1fr)]">
      <div class="grid auto-rows-min content-start gap-3 grid-cols-2 md:grid-cols-1">
        <div
          v-for="item in attributeStats"
          :key="item.key"
          class="flex items-center justify-between rounded-md border px-3 py-2"
        >
          <span>{{ item.label }}</span>
          <span class="tabular-nums">{{ formatNumber(item.value) }}/1000</span>
        </div>
      </div>
      <div class="relative h-47 w-full min-w-0 overflow-hidden">
        <canvas ref="radarCanvas" class="block h-full w-full" aria-label="四维雷达图" />
      </div>
    </AppCardContent>
  </AppCard>
</template>
