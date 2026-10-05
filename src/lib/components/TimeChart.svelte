<script lang="ts" module>
  import {
    Chart,
    Legend,
    LinearScale,
    LineController,
    LineElement,
    PointElement,
    Tooltip,
    type ChartConfiguration,
    type Plugin,
  } from 'chart.js';
  import type { Point } from '../series';

  export interface Series {
    label: string;
    points: Point[];
    /** `left` (default) or `right` y axis. */
    axis?: 'left' | 'right';
    color?: string;
    /** Tooltip line for one point; default `label: y`. */
    tooltip?: (point: Point) => string;
    /** Draw as steps: sweep history values only change at sweeps. */
    stepped?: boolean;
    /** Dashed line, to keep series that coincide distinguishable. */
    dashed?: boolean;
  }

  // Register only what the line charts use, so the bundle stays small.
  Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend);

  /** Distance between the first two ticks; `undefined` with fewer than two. */
  function tickStep(ticks: { value: number }[]): number | undefined {
    return ticks.length > 1 ? Math.abs(ticks[1]!.value - ticks[0]!.value) : undefined;
  }

  /** Brand series colours (stats.domainconnect.org order). */
  export const SERIES_COLORS = [
    '#03263B',
    '#ff6663',
    '#00bfff',
    '#194f6e',
    '#e67e22',
    '#2ecc71',
    '#9b59b6',
  ];
</script>

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { BEFORE_SCANS, beforeScansTitle } from '../cells';
  import { formatDate } from '../format';

  interface Props {
    series: Series[];
    leftTitle: string;
    rightTitle?: string;
    /** Tick text; `step` is the distance between ticks, for decimals that tell them apart. */
    formatLeft?: (v: number, step?: number) => string;
    formatRight?: (v: number, step?: number) => string;
    /** Accessible description of what the chart shows. */
    label: string;
    /** Draw the legend; off when the page shows its own. */
    legend?: boolean;
    /** Scanner start date: shade the span before it, for charts of sweep series. */
    beforeScans?: Date | null;
  }

  let {
    series,
    leftTitle,
    rightTitle,
    formatLeft,
    formatRight,
    label,
    legend = true,
    beforeScans,
  }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let chart: Chart<'line', Point[]> | undefined;
  let spanLabel: HTMLElement | undefined = $state();

  /** Shades the span before the scanner start date and places its label over it. */
  function beforeScansPlugin(until: Date): Plugin<'line'> {
    return {
      id: 'beforeScans',
      beforeDatasetsDraw(c) {
        const { left, right, top, bottom } = c.chartArea;
        const scale = c.scales.x;
        const edge = scale ? Math.min(scale.getPixelForValue(until.getTime()), right) : left;
        const shown = edge > left;
        if (spanLabel) {
          spanLabel.hidden = !shown;
          spanLabel.style.left = `${left}px`;
          spanLabel.style.top = `${top}px`;
        }
        if (!shown) return;
        const ctx = c.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(3, 38, 59, 0.07)';
        ctx.fillRect(left, top, edge - left, bottom - top);
        ctx.restore();
      },
    };
  }

  function config(): ChartConfiguration<'line', Point[]> {
    const hasRight = series.some((s) => s.axis === 'right');
    return {
      type: 'line',
      plugins: beforeScans ? [beforeScansPlugin(beforeScans)] : [],
      data: {
        datasets: series.map((s, i) => {
          const color = s.color ?? SERIES_COLORS[i % SERIES_COLORS.length]!;
          return {
            label: s.label,
            data: s.points,
            parsing: false,
            yAxisID: s.axis === 'right' ? 'right' : 'left',
            borderColor: color,
            backgroundColor: color,
            borderWidth: 3,
            pointRadius: 4,
            stepped: s.stepped ? 'before' : false,
            borderDash: s.dashed ? [6, 4] : [],
            // Missing rows are gaps, not zeros; connect only measured points.
            spanGaps: true,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          x: {
            type: 'linear',
            grid: { color: '#e0e0e0' },
            ticks: {
              callback: (v) => formatDate(new Date(Number(v))),
              maxRotation: 0,
              autoSkipPadding: 24,
            },
          },
          left: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: leftTitle },
            grid: { color: '#e0e0e0' },
            ticks: formatLeft
              ? { callback: (v, _i, ticks) => formatLeft(Number(v), tickStep(ticks)) }
              : {},
          },
          right: {
            type: 'linear',
            position: 'right',
            display: hasRight,
            beginAtZero: true,
            title: { display: Boolean(rightTitle), text: rightTitle ?? '' },
            grid: { display: false },
            ticks: {
              precision: 0,
              ...(formatRight
                ? { callback: (v, _i, ticks) => formatRight(Number(v), tickStep(ticks)) }
                : {}),
            },
          },
        },
        plugins: {
          legend: { display: legend, position: 'top', align: 'start' },
          tooltip: {
            callbacks: {
              title: (items) => (items[0] ? formatDate(new Date(items[0].parsed.x ?? 0)) : ''),
              label: (item) => {
                const s = series[item.datasetIndex]!;
                const point = item.raw as Point;
                return s.tooltip ? s.tooltip(point) : `${s.label}: ${point.y}`;
              },
            },
          },
        },
      },
    };
  }

  $effect(() => {
    if (!canvas) return;
    chart?.destroy();
    chart = new Chart(canvas, config());
  });

  onDestroy(() => chart?.destroy());
</script>

<div class="chart-box" role="img" aria-label={label}>
  <canvas bind:this={canvas}></canvas>
  {#if beforeScans}
    <span
      class="before-scans"
      data-testid="before-scans"
      bind:this={spanLabel}
      title={beforeScansTitle(beforeScans)}
      hidden>{BEFORE_SCANS}</span
    >
  {/if}
</div>

<style>
  .chart-box {
    position: relative;
    height: 400px;
  }

  .before-scans {
    position: absolute;
    padding: 2px 6px;
    font-size: 0.7rem;
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    cursor: help;
  }

  .before-scans[hidden] {
    display: none;
  }

  @media (max-width: 768px) {
    .chart-box {
      height: 300px;
    }
  }
</style>
