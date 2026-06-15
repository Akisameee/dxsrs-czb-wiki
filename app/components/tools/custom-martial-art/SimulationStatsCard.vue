<script setup lang="ts">
import type { Chart as ChartInstance, Plugin, TooltipItem } from "chart.js";
import type { PowerSummary, SimulationAnalysis } from "~/components/tools/custom-martial-art/types";
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
  analysis: SimulationAnalysis | null;
}>();

const finalPercentCanvas = useTemplateRef<HTMLCanvasElement>("finalPercentCanvas");
const powerCanvas = useTemplateRef<HTMLCanvasElement>("powerCanvas");

type PowerMarker = {
  label: string;
  value: number;
  color: string;
};

type ChartPoint = {
  x: number;
  y: number;
};

type ChartKey = "finalPercent" | "power";

const charts: Record<ChartKey, ChartInstance<"line", ChartPoint[]> | null> = {
  finalPercent: null,
  power: null,
};
const hoveredMarkers: Record<ChartKey, PowerMarker | null> = {
  finalPercent: null,
  power: null,
};
let renderVersion = 0;
let renderFrame: number | null = null;
let resizeObserver: ResizeObserver | null = null;

async function renderDistributionChart(options: {
  key: ChartKey;
  version: number;
  canvas: HTMLCanvasElement | null | undefined;
  points: Array<{ x: number | string; y: number | string }>;
  summary: PowerSummary | null | undefined;
  label: string;
}) {
  await nextTick();
  if (options.version !== renderVersion) return;
  if (!import.meta.client || !options.canvas) return;

  const { key, points, summary, label } = options;
  if (!points.length || !summary) {
    charts[key]?.destroy();
    charts[key] = null;
    return;
  }
  if (options.canvas.clientWidth <= 0 || options.canvas.clientHeight <= 0) return;

  const chartPoints = points
    .map((point) => ({ x: Number(point.x), y: Number(point.y) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const xValues = chartPoints.map((point) => point.x);
  const xMin = xValues.length ? Math.min(...xValues) : undefined;
  const xMax = xValues.length ? Math.max(...xValues) : undefined;

  const { default: Chart } = await import("chart.js/auto");
  if (options.version !== renderVersion) return;

  const styles = getComputedStyle(document.documentElement);
  const primary = styles.getPropertyValue("--primary").trim() || "#111";
  const border = styles.getPropertyValue("--border").trim() || "#ddd";
  const foreground = styles.getPropertyValue("--foreground").trim() || "#111";
  const background = styles.getPropertyValue("--background").trim() || "#fff";
  const muted = styles.getPropertyValue("--muted-foreground").trim() || "#666";
  const markerPlugin: Plugin<"line"> = {
    id: `${key}-summary-markers`,
    afterEvent(chart, args) {
      const { chartArea } = chart;
      const xScale = chart.scales.x;
      const { x: eventX, y: eventY } = args.event;
      if (!xScale || typeof eventX !== "number" || typeof eventY !== "number") return;
      const markers = summaryMarkers(summary, primary, foreground, muted);
      const hovered = markers.find((marker) => {
        const x = xScale.getPixelForValue(marker.value);
        return (
          eventX >= chartArea.left &&
          eventX <= chartArea.right &&
          eventY >= chartArea.top &&
          eventY <= chartArea.bottom &&
          Math.abs(eventX - x) <= 6
        );
      }) || null;

      if (hoveredMarkers[key]?.label !== hovered?.label) {
        hoveredMarkers[key] = hovered;
        args.changed = true;
      }
    },
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      const xScale = chart.scales.x;
      if (!xScale) return;
      const markers = summaryMarkers(summary, primary, foreground, muted);

      ctx.save();
      ctx.font = "12px sans-serif";
      ctx.textBaseline = "top";
      for (const marker of markers) {
        const x = xScale.getPixelForValue(marker.value);
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

      const hoveredMarker = hoveredMarkers[key];
      if (hoveredMarker) {
        const x = xScale.getPixelForValue(hoveredMarker.value);
        const text = `${hoveredMarker.label} ${formatNumber(hoveredMarker.value)}`;
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
  charts[key]?.destroy();
  charts[key] = new Chart(options.canvas, {
    type: "line",
    data: {
      datasets: [
        {
          label,
          data: chartPoints,
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
            label(context: TooltipItem<"line">) {
              return `${label} ${formatNumber(context.parsed.x)}`;
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
            callback(value: number | string) {
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
  requestAnimationFrame(() => {
    charts[key]?.resize();
  });
}

function renderCharts() {
  const version = ++renderVersion;
  void renderDistributionChart({
    key: "finalPercent",
    version,
    canvas: finalPercentCanvas.value,
    points: props.analysis?.finalValues?.finalPercentDensity || [],
    summary: props.analysis?.finalValues?.finalPercentSummary,
    label: "成长",
  });
  void renderDistributionChart({
    key: "power",
    version,
    canvas: powerCanvas.value,
    points: props.analysis?.finalValues?.powerDensity || [],
    summary: props.analysis?.finalValues?.powerSummary,
    label: "威力",
  });
}

function scheduleRenderCharts() {
  if (!import.meta.client) return;
  if (renderFrame !== null) cancelAnimationFrame(renderFrame);
  renderFrame = requestAnimationFrame(() => {
    renderFrame = null;
    renderCharts();
  });
}

watch(() => props.analysis?.finalValues, () => {
  scheduleRenderCharts();
}, { deep: true });

onMounted(() => {
  scheduleRenderCharts();
  if (!import.meta.client || typeof ResizeObserver === "undefined") return;

  resizeObserver = new ResizeObserver((entries) => {
    if (entries.some((entry) => entry.contentRect.width > 0 && entry.contentRect.height > 0)) {
      scheduleRenderCharts();
    }
  });

  void nextTick(() => {
    if (finalPercentCanvas.value) resizeObserver?.observe(finalPercentCanvas.value);
    if (powerCanvas.value) resizeObserver?.observe(powerCanvas.value);
  });
});

onBeforeUnmount(() => {
  if (renderFrame !== null) cancelAnimationFrame(renderFrame);
  resizeObserver?.disconnect();
  charts.finalPercent?.destroy();
  charts.power?.destroy();
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

function summaryMarkers(summary: PowerSummary, primary: string, foreground: string, muted: string) {
  return [
    { label: "最小", value: Number(summary.min), color: muted },
    { label: "中位", value: Number(summary.median), color: primary },
    { label: "均值", value: Number(summary.mean), color: foreground },
    { label: "最大", value: Number(summary.max), color: muted },
  ].filter((item) => Number.isFinite(item.value));
}

const sections = computed(() => [
  { key: "styles", title: "风格命中概率", rows: props.analysis?.styles || [] },
  { key: "areas", title: "攻击范围命中概率", rows: props.analysis?.areas || [] },
  { key: "effects", title: "最高等级特殊效果命中概率", rows: props.analysis?.effects || [] },
]);
</script>

<template>
  <AppCard>
    <AppCardHeader>
      <CardTitle>统计结果</CardTitle>
    </AppCardHeader>
    <AppCardContent class="grid gap-4">
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
                <AppButton variant="outline" size="sm" class="mt-1 w-fit">
                  {{ open ? "收起" : `展开全部 ${section.rows.length}` }}
                </AppButton>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        <div class="grid gap-3">
          <div class="text-sm text-muted-foreground">最终成长进度</div>
          <div class="h-40 bg-background">
            <canvas ref="finalPercentCanvas" class="h-full w-full" aria-label="最终成长进度概率分布" />
          </div>
        </div>

        <div class="grid gap-3">
          <div class="text-sm text-muted-foreground">最终威力</div>
          <div class="h-40 bg-background">
            <canvas ref="powerCanvas" class="h-full w-full" aria-label="最终威力概率分布" />
          </div>
        </div>
      </div>
    </AppCardContent>
  </AppCard>
</template>
