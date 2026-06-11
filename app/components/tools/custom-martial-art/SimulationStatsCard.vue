<script setup lang="ts">
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

const props = defineProps<{
  analysis: any | null;
}>();

const powerCanvas = ref<HTMLCanvasElement | null>(null);
let powerChart: any = null;

async function renderPowerChart() {
  await nextTick();
  if (!import.meta.client || !powerCanvas.value) return;

  const points = props.analysis?.finalValues?.powerDensity || [];
  const summary = props.analysis?.finalValues?.powerSummary;
  if (!points.length || !summary) {
    powerChart?.destroy();
    powerChart = null;
    return;
  }
  const xValues = points.map((point: any) => Number(point.x)).filter((value: number) => Number.isFinite(value));
  const xMin = xValues.length ? Math.min(...xValues) : undefined;
  const xMax = xValues.length ? Math.max(...xValues) : undefined;

  const { default: Chart } = await import("chart.js/auto");
  const styles = getComputedStyle(document.documentElement);
  const primary = styles.getPropertyValue("--primary").trim() || "#111";
  const border = styles.getPropertyValue("--border").trim() || "#ddd";
  const foreground = styles.getPropertyValue("--foreground").trim() || "#111";
  const background = styles.getPropertyValue("--background").trim() || "#fff";
  const muted = styles.getPropertyValue("--muted-foreground").trim() || "#666";
  const markerPlugin = {
    id: "power-summary-markers",
    afterEvent(chart: any, args: any) {
      const powerSummary = props.analysis?.finalValues?.powerSummary;
      if (!powerSummary) return;

      const { chartArea, scales } = chart;
      const event = args.event;
      const markers = powerMarkers(powerSummary, primary, foreground);
      const hovered = markers.find((marker) => {
        const x = scales.x.getPixelForValue(marker.value);
        return (
          event.x >= chartArea.left &&
          event.x <= chartArea.right &&
          event.y >= chartArea.top &&
          event.y <= chartArea.bottom &&
          Math.abs(event.x - x) <= 6
        );
      }) || null;

      if (chart.$powerMarkerHover?.label !== hovered?.label) {
        chart.$powerMarkerHover = hovered;
        args.changed = true;
      }
    },
    afterDatasetsDraw(chart: any) {
      const powerSummary = props.analysis?.finalValues?.powerSummary;
      if (!powerSummary) return;

      const { ctx, chartArea, scales } = chart;
      const markers = powerMarkers(powerSummary, primary, foreground);

      ctx.save();
      ctx.font = "12px sans-serif";
      ctx.textBaseline = "top";
      for (const marker of markers) {
        const x = scales.x.getPixelForValue(marker.value);
        if (x < chartArea.left || x > chartArea.right) continue;

        ctx.strokeStyle = marker.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const hovered = chart.$powerMarkerHover;
      if (hovered) {
        const x = scales.x.getPixelForValue(hovered.value);
        const text = `${hovered.label} ${formatNumber(hovered.value)}`;
        const paddingX = 6;
        const paddingY = 4;
        const width = ctx.measureText(text).width + paddingX * 2;
        const height = 20;
        const left = Math.min(Math.max(x + 8, chartArea.left), chartArea.right - width);
        const top = chartArea.top + 6;

        ctx.fillStyle = background;
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.fillRect(left, top, width, height);
        ctx.strokeRect(left, top, width, height);
        ctx.fillStyle = muted;
        ctx.fillText(text, left + paddingX, top + paddingY);
      }
      ctx.restore();
    },
  };
  powerChart?.destroy();
  powerChart = new Chart(powerCanvas.value, {
    type: "line",
    data: {
      datasets: [
        {
          label: "威力",
          data: points,
          parsing: false,
          borderColor: primary,
          backgroundColor: `color-mix(in oklch, ${primary} 12%, transparent)`,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          tension: 0.28,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: "nearest",
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
          callbacks: {
            title() {
              return [];
            },
            label(context: any) {
              return `威力 ${formatNumber(context.parsed.x)}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: xMin,
          max: xMax,
          offset: false,
          bounds: "data",
          grid: {
            color: `color-mix(in oklch, ${border} 60%, transparent)`,
          },
          ticks: {
            count: 5,
            includeBounds: true,
            callback(value: any) {
              return formatNumber(value);
            },
          },
        },
        y: {
          min: 0,
          grid: {
            color: `color-mix(in oklch, ${border} 50%, transparent)`,
          },
          ticks: {
            display: false,
          },
        },
      },
    },
    plugins: [markerPlugin],
  });
}

watch(() => props.analysis?.finalValues?.powerDensity, () => {
  void renderPowerChart();
}, { deep: true });

onMounted(() => {
  void renderPowerChart();
});

onBeforeUnmount(() => {
  powerChart?.destroy();
});

function formatPercent(value: number | string | null | undefined) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0.0%";
  return `${(number * 100).toFixed(1)}%`;
}

function formatNumber(value: number | string | null | undefined, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  const text = number.toFixed(digits);
  return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
}

function barWidth(value: number | string | null | undefined) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "0%";
  return `${Math.max(2, Math.min(100, number * 100))}%`;
}

function powerMarkers(powerSummary: any, primary: string, foreground: string) {
  return [
    { label: "中位", value: Number(powerSummary.median), color: primary },
    { label: "均值", value: Number(powerSummary.mean), color: foreground },
  ].filter((item) => Number.isFinite(item.value));
}

const sections = computed(() => [
  { key: "styles", title: "风格命中概率", rows: props.analysis?.styles || [] },
  { key: "areas", title: "攻击范围命中概率", rows: props.analysis?.areas || [] },
  { key: "effects", title: "最高等级特殊效果命中概率", rows: props.analysis?.effects || [] },
]);
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>统计结果</CardTitle>
    </CardHeader>
    <CardContent class="grid gap-4">
      <div v-if="!analysis" class="py-8 text-center text-sm text-muted-foreground">
        点击模拟查看当前初始输入的分布。
      </div>

      <div v-else class="grid gap-5">
        <div
          v-for="section in sections"
          :key="section.key"
          class="grid gap-2"
        >
          <div class="text-sm text-muted-foreground">{{ section.title }}</div>
          <div class="grid gap-2">
            <div
              v-for="row in section.rows.slice(0, 8)"
              :key="row.label"
              class="grid grid-cols-[88px_minmax(0,1fr)_56px] items-center gap-3 text-sm"
            >
              <span class="truncate">{{ row.label }}</span>
              <div class="h-2 rounded-full bg-muted">
                <div class="h-2 rounded-full bg-primary" :style="{ width: barWidth(row.value) }" />
              </div>
              <span class="text-right tabular-nums">{{ formatPercent(row.value) }}</span>
            </div>

            <Collapsible v-if="section.rows.length > 8" v-slot="{ open }">
              <CollapsibleContent class="grid gap-2">
                <div
                  v-for="row in section.rows.slice(8)"
                  :key="row.label"
                  class="grid grid-cols-[88px_minmax(0,1fr)_56px] items-center gap-3 text-sm"
                >
                  <span class="truncate">{{ row.label }}</span>
                  <div class="h-2 rounded-full bg-muted">
                    <div class="h-2 rounded-full bg-primary" :style="{ width: barWidth(row.value) }" />
                  </div>
                  <span class="text-right tabular-nums">{{ formatPercent(row.value) }}</span>
                </div>
              </CollapsibleContent>
              <CollapsibleTrigger as-child>
                <Button variant="outline" size="sm" class="mt-1 w-fit">
                  {{ open ? "收起" : `展开全部 ${section.rows.length}` }}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        <div class="grid gap-3">
          <div class="text-sm text-muted-foreground">最终威力</div>
          <div class="h-40 bg-background">
            <canvas ref="powerCanvas" class="h-full w-full" aria-label="最终威力概率分布" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
