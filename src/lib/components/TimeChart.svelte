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
  import { formatDate } from '../format';

  interface Props {
    series: Series[];
    leftTitle: string;
    rightTitle?: string;
    /** Tick text; `step` is the distance between ticks, for decimals that tell them apart. */
    formatLeft?: (v: number, step?: number) => string;
    formatRight?: (v: number, step?: number) => string;
    /** Left axis starts at 0 (default); off fits the axis to the data. */
    leftFromZero?: boolean;
    /** Accessible description of what the chart shows. */
    label: string;
    /** Draw the legend; off when the page shows its own. */
    legend?: boolean;
  }

  let {
    series,
    leftTitle,
    rightTitle,
    formatLeft,
    formatRight,
    leftFromZero = true,
    label,
    legend = true,
  }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let chart: Chart<'line', Point[]> | undefined;

  function config(): ChartConfiguration<'line', Point[]> {
    const hasRight = series.some((s) => s.axis === 'right');
    return {
      type: 'line',
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
            beginAtZero: leftFromZero,
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
</div>

<style>
  .chart-box {
    position: relative;
    height: 400px;
  }

  @media (max-width: 768px) {
    .chart-box {
      height: 300px;
    }
  }
</style>
