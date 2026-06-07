import Chart from "chart.js/auto";
import { enumLabel } from "../../shared/utils.js";
import { SelfCreateSimulation } from "./simulator.js";
import {
  estimateGreedyImprovementStats,
  summarizeFinalValueDistributions,
} from "./probability.js";
import {
  ATTRIBUTE_NAMES,
  ATTRIBUTE_TOTAL,
  escapeHtml,
  effectText,
  formatMean,
  formatPercent,
  rareClass,
  rareText,
  rowsOf,
  setButtonBusy,
  uniqueSorted,
  waitForPaint,
  weaponOptions,
} from "./view-utils.js";

const SIMULATOR_DESCRIPTION = "输入初始四维和武器类型，模拟贪心锁定后的风格、攻击范围、特殊效果和威力分布。";

function controlNumber(form, name) {
  return Number(form.elements[name]?.value);
}

function numberInput(form, name) {
  return form.querySelector(`[name='${name}']`);
}

function attributeTotal(form) {
  return ATTRIBUTE_NAMES
    .map((name) => Number(numberInput(form, name).value) || 0)
    .reduce((sum, value) => sum + value, 0);
}

function simulationTrialCount(els) {
  return Math.max(1, Math.trunc(Number(els.simulationCount?.value) || 1));
}

function renderStat(label, value, className = "") {
  return `
    <div class="game-stat-row ${className}">
      <span class="game-stat-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function barRows(items, options = {}) {
  const max = Math.max(1, ...items.map((item) => Number(item.value || 0)));
  const valueText = options.valueText || ((value) => formatPercent(value));
  return items.map((item) => {
    const width = Math.max(0, Math.min(100, (Number(item.value || 0) / max) * 100));
    return `
      <div class="analysis-bar-row">
        <span class="analysis-bar-label">${escapeHtml(item.label)}</span>
        <div class="analysis-bar-track">
          <span class="analysis-bar-fill" style="width: ${width.toFixed(2)}%"></span>
        </div>
        <strong>${escapeHtml(valueText(item.value, item))}</strong>
      </div>
    `;
  }).join("");
}

function renderAnalysisSection(title, rows, options = {}) {
  if (!rows.length) return "";
  return `
    <section class="analysis-section">
      <h2>${escapeHtml(title)}</h2>
      <div class="analysis-bars">${barRows(rows, options)}</div>
    </section>
  `;
}

function renderProgress(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderDistributionChartSection(id, title, summary) {
  const min = Number(summary?.min || 0);
  const q1 = Number(summary?.q1 || 0);
  const median = Number(summary?.median || 0);
  const q3 = Number(summary?.q3 || 0);
  const max = Number(summary?.max || 0);
  const mean = Number(summary?.mean || 0);

  return `
    <section class="analysis-section">
      <h2>${escapeHtml(title)}</h2>
      <div class="analysis-chart-wrap">
        <canvas id="${escapeHtml(id)}" class="analysis-chart"></canvas>
      </div>
      <div class="analysis-chart-values">
        <span>最小 ${escapeHtml(formatMean(min))}</span>
        <span>Q1 ${escapeHtml(formatMean(q1))}</span>
        <span>中位 ${escapeHtml(formatMean(median))}</span>
        <span>Q3 ${escapeHtml(formatMean(q3))}</span>
        <span>最大 ${escapeHtml(formatMean(max))}</span>
        <strong>均值 ${escapeHtml(formatMean(mean))}</strong>
      </div>
    </section>
  `;
}

const quantileMarkerPlugin = {
  id: "selfCreateQuantileMarkers",
  afterDatasetsDraw(chart) {
    const markers = chart.options.plugins?.selfCreateMarkers || [];
    if (!markers.length) return;

    const xScale = chart.scales.x;
    const { top, bottom } = chart.chartArea;
    const ctx = chart.ctx;
    ctx.save();
    for (const marker of markers) {
      const x = xScale.getPixelForValue(marker.value);
      if (!Number.isFinite(x)) continue;
      ctx.strokeStyle = marker.color;
      ctx.lineWidth = marker.width || 1;
      ctx.setLineDash(marker.dash || []);
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
    ctx.restore();
  },
};

Chart.register(quantileMarkerPlugin);

export function initSelfCreateSimulator(context) {
  const { data, enums, effectNames } = context;
  const els = {
    form: document.getElementById("self-create-form"),
    status: document.getElementById("self-create-status"),
    attributeTotal: document.getElementById("attribute-total"),
    weaponType: document.getElementById("weapon-type"),
    preview: document.getElementById("self-create-preview"),
    simulationCount: document.getElementById("simulation-count"),
    runAnalysisButton: document.getElementById("run-analysis-button"),
    simulationResults: document.getElementById("simulation-results"),
  };
  const state = {
    simulation: null,
    analysis: null,
    seed: null,
    charts: {},
  };

  function isAttributeTotalValid() {
    return attributeTotal(els.form) === ATTRIBUTE_TOTAL;
  }

  function updateAttributeTotal() {
    const total = attributeTotal(els.form);
    const seedText = state.seed === null || total !== ATTRIBUTE_TOTAL ? "" : `，seed ${state.seed}`;
    els.attributeTotal.textContent = `四维 ${total} / ${ATTRIBUTE_TOTAL}${seedText}`;
    els.attributeTotal.classList.toggle("is-invalid", total !== ATTRIBUTE_TOTAL);
  }

  function buildInput() {
    return {
      name: "自创武功",
      yi: controlNumber(els.form, "yi"),
      qi: controlNumber(els.form, "qi"),
      xing: controlNumber(els.form, "xing"),
      shen: controlNumber(els.form, "shen"),
      weaponType: controlNumber(els.form, "weaponType"),
    };
  }

  function renderPreview(summary) {
    const current = summary.at(-1);
    if (!current) {
      els.preview.innerHTML = `<div class="empty-state">填写参数后点击模拟。</div>`;
      return;
    }

    const typeName = enumLabel(enums, "BingQiType", Number(els.weaponType.value), "未知");
    const currentRareClass = rareClass(current.rare, enums);
    els.preview.className = `form-card current-result-card ${currentRareClass}`;
    els.preview.innerHTML = `
      <div class="game-result-body">
        ${renderStat("武功品阶", rareText(current.rare, enums), `is-rare ${currentRareClass}`)}
        ${renderStat("武功类型", typeName)}
        ${renderStat("风格", current.style.name)}
        ${renderStat("攻击范围", current.area.name)}
        ${renderStat("招式威力", current.power)}
        ${renderStat("消耗真气", current.cost ?? "未知")}
        ${renderStat("特殊效果", effectText(current.effect, effectNames), "is-effect")}
        ${renderStat("改良空间", current.gailiangkongjian)}
      </div>
    `;
  }

  function updateButtons() {
    updateAttributeTotal();
    els.runAnalysisButton.disabled = !isAttributeTotalValid();
  }

  function clearForInvalidInput() {
    state.simulation = null;
    state.analysis = null;
    state.seed = null;
    els.status.textContent = SIMULATOR_DESCRIPTION;
    els.preview.className = "form-card current-result-card";
    els.preview.innerHTML = `<div class="empty-state">四维总和必须为 ${ATTRIBUTE_TOTAL} 后才能自创。</div>`;
    els.simulationResults.innerHTML = `<div class="empty-state">四维总和必须为 ${ATTRIBUTE_TOTAL} 后才能模拟。</div>`;
    updateButtons();
  }

  function runSimulation() {
    if (!isAttributeTotalValid()) {
      clearForInvalidInput();
      return;
    }

    if (!state.simulation) {
      state.simulation = new SelfCreateSimulation(buildInput(), data);
    }

    const summary = state.simulation.summaries(enums.LianSuo_FG);
    state.seed = state.simulation.seed;
    els.status.textContent = SIMULATOR_DESCRIPTION;
    renderPreview(summary);
    updateButtons();
  }

  function resetSimulation() {
    state.simulation = null;
    state.analysis = null;
    state.seed = null;
    destroyCharts();
    els.simulationResults.innerHTML = `<div class="empty-state">点击模拟查看当前初始输入的分布。</div>`;
    runSimulation();
  }

  function styleTargets() {
    return uniqueSorted(rowsOf(data?.chainRows)
      .map((row) => Number(row.fengge))
      .filter((id) => id > 0))
      .map((id) => ({
        id,
        name: enumLabel(enums, "LianSuo_FG", id, String(id)),
      }));
  }

  function effectMaxTargets() {
    const maxByType = new Map();
    for (const row of rowsOf(data?.ziChuangBuffRows)) {
      const type = Number(row.bufftype);
      const value = Number(row.value || 0);
      if (!Number.isFinite(type) || type === 99 || value <= 0) continue;
      maxByType.set(type, Math.max(maxByType.get(type) || 0, value));
    }

    return [...maxByType.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([id, maxLevel]) => ({
        id,
        maxLevel,
        name: effectNames.get(id) || `效果 ${id}`,
      }));
  }

  function areaTargets() {
    return uniqueSorted(rowsOf(data?.wugongRows)
      .filter((row) => Number(row.type) === Number(els.weaponType.value) && !row.iszichuang && row.attackareaname && row.attackareaname !== "无")
      .map((row) => row.attackareaname))
      .map((name) => ({ name }));
  }

  function renderSimulationResults() {
    const analysis = state.analysis;
    if (!analysis) {
      destroyCharts();
      els.simulationResults.innerHTML = `<div class="empty-state">点击模拟查看当前初始输入的分布。</div>`;
      return;
    }

    destroyCharts();
    els.simulationResults.innerHTML = `
      ${renderAnalysisSection("风格命中概率", analysis.styles)}
      ${renderAnalysisSection("攻击范围命中概率", analysis.areas)}
      ${renderAnalysisSection("最高等级特殊效果命中概率", analysis.effects)}
      ${renderDistributionChartSection("power-distribution-chart", "最终威力概率分布", analysis.finalValues.powerSummary)}
    `;
    renderDistributionCharts();
  }

  function destroyCharts() {
    for (const chart of Object.values(state.charts)) {
      chart?.destroy();
    }
    state.charts = {};
  }

  function chartMarkers(summary) {
    return [
      { value: summary.q1, color: "#5ba579", width: 1 },
      { value: summary.median, color: "#236847", width: 2 },
      { value: summary.q3, color: "#5ba579", width: 1 },
      { value: summary.mean, color: "#9b6a1e", width: 2, dash: [5, 4] },
    ];
  }

  function renderDensityChart(canvasId, label, points, summary) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const xMin = Math.min(Number(summary.min || 0), ...points.map((point) => Number(point.x)));
    const xMax = Math.max(Number(summary.max || 0), ...points.map((point) => Number(point.x)));
    const xPadding = xMax === xMin ? Math.max(1, Math.abs(xMin) * 0.05) : 0;

    return new Chart(canvas, {
      type: "line",
      data: {
        datasets: [
          {
            label,
            data: points,
            parsing: false,
            borderColor: "#2f8f5f",
            backgroundColor: "rgba(47, 143, 95, 0.08)",
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
            callbacks: {
              title() {
                return [];
              },
              label(context) {
                return formatMean(context.parsed.x);
              },
            },
          },
          selfCreateMarkers: chartMarkers(summary),
        },
        scales: {
          x: {
            type: "linear",
            min: xMin - xPadding,
            max: xMax + xPadding,
            grid: {
              color: "rgba(80, 99, 110, 0.12)",
            },
            ticks: {
              maxTicksLimit: 6,
              callback(value) {
                return formatMean(value);
              },
            },
          },
          y: {
            min: 0,
            grid: {
              color: "rgba(80, 99, 110, 0.12)",
            },
            ticks: {
              callback(value) {
                return formatMean(value, 3);
              },
            },
          },
        },
      },
    });
  }

  function renderDistributionCharts() {
    const finalValues = state.analysis?.finalValues;
    if (!finalValues) return;

    state.charts.power = renderDensityChart(
      "power-distribution-chart",
      "威力",
      finalValues.powerDensity,
      finalValues.powerSummary
    );
  }

  async function runInitialAnalysis() {
    runSimulation();
    if (!state.simulation || !isAttributeTotalValid()) return;

    const trials = simulationTrialCount(els);
    els.status.textContent = SIMULATOR_DESCRIPTION;
    setButtonBusy(els.runAnalysisButton, true, "模拟中");
    els.simulationResults.innerHTML = renderProgress(`模拟中...每项 ${trials} 次`);
    await waitForPaint();

    try {
      const styleNames = enums.LianSuo_FG;
      const finalPowerValues = [];
      const styleTargetList = styleTargets();
      const areaTargetList = areaTargets();
      const effectTargetList = effectMaxTargets();
      const styles = [];
      const areas = [];
      const effects = [];

      for (let index = 0; index < styleTargetList.length; index += 1) {
        const style = styleTargetList[index];
        els.simulationResults.innerHTML = renderProgress(`模拟中...风格 ${index + 1} / ${styleTargetList.length}`);
        const stats = await estimateGreedyImprovementStats(state.simulation, { styleId: style.id }, {
            trials,
            styleNames,
            includeSamples: true,
          });
        finalPowerValues.push(...stats.samples.power);
        styles.push({
          label: style.name,
          value: stats.styleProbability,
        });
        await waitForPaint();
      }
      styles.sort((a, b) => b.value - a.value);

      for (let index = 0; index < areaTargetList.length; index += 1) {
        const area = areaTargetList[index];
        els.simulationResults.innerHTML = renderProgress(`模拟中...攻击范围 ${index + 1} / ${areaTargetList.length}`);
        const stats = await estimateGreedyImprovementStats(state.simulation, { areaName: area.name }, {
            trials,
            styleNames,
          });
        areas.push({
          label: area.name,
          value: stats.areaProbability,
        });
        await waitForPaint();
      }
      areas.sort((a, b) => b.value - a.value);

      for (let index = 0; index < effectTargetList.length; index += 1) {
        const effect = effectTargetList[index];
        els.simulationResults.innerHTML = renderProgress(`模拟中...效果 ${index + 1} / ${effectTargetList.length}`);
        const stats = await estimateGreedyImprovementStats(state.simulation, {
            effectType: effect.id,
            minEffectValue: effect.maxLevel,
          }, {
            trials,
            styleNames,
            includeSamples: true,
          });
        finalPowerValues.push(...stats.samples.power);
        effects.push({
          label: `${effect.name} ${effect.maxLevel}`,
          value: stats.effectProbability,
        });
        await waitForPaint();
      }
      effects.sort((a, b) => b.value - a.value);

      const finalValues = summarizeFinalValueDistributions(finalPowerValues, []);

      state.analysis = {
        trials,
        styles,
        effects,
        finalValues,
        areas,
      };
      els.status.textContent = SIMULATOR_DESCRIPTION;
      renderSimulationResults();
    } catch (error) {
      els.status.textContent = SIMULATOR_DESCRIPTION;
      els.simulationResults.innerHTML = renderProgress(`模拟失败：${error.message}`);
    } finally {
      setButtonBusy(els.runAnalysisButton, false);
      updateButtons();
    }
  }

  els.weaponType.innerHTML = weaponOptions(enums);
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    runInitialAnalysis();
  });
  for (const input of els.form.querySelectorAll("[name='yi'], [name='qi'], [name='xing'], [name='shen'], [name='weaponType']")) {
    const eventName = ATTRIBUTE_NAMES.includes(input.name) ? "input" : "change";
    input.addEventListener(eventName, resetSimulation);
  }
  els.runAnalysisButton.addEventListener("click", runInitialAnalysis);

  updateButtons();
  runSimulation();
}
