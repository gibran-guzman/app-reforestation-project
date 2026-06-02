import { Component, inject, OnInit, signal, ElementRef, viewChild, effect } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { ReportsService } from '../../services/reports.service';
import { SpeciesService } from '../../services/species.service';
import { ZoneService } from '../../services/zone.service';
import type { SurvivalReport, SpeciesStat, ZoneSummary, Species, Zone } from '../../models';

type ReportFilters = { species_id?: number; zone_id?: number };

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  imports: [DatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export default class Reports implements OnInit {
  private reportsService = inject(ReportsService);
  private speciesService = inject(SpeciesService);
  private zoneService = inject(ZoneService);

  report = signal<SurvivalReport | null>(null);
  speciesStats = signal<SpeciesStat[]>([]);
  zoneSummary = signal<ZoneSummary[]>([]);
  species = signal<Species[]>([]);
  zones = signal<Zone[]>([]);
  loading = signal(true);
  error = signal('');
  filterSpecies = signal<number | ''>('');
  filterZone = signal<number | ''>('');
  downloading = signal(false);

  survivalChartRef = viewChild<ElementRef<HTMLCanvasElement>>('survivalChart');
  speciesChartRef = viewChild<ElementRef<HTMLCanvasElement>>('speciesChart');
  private survivalChart: Chart | null = null;
  private speciesChart: Chart | null = null;

  constructor() {
    effect(() => {
      if (this.survivalChartRef() && this.speciesChartRef()) {
        this.renderCharts();
      }
    });
  }

  ngOnInit() {
    this.speciesService.list().subscribe((res) => this.species.set(res.data));
    this.zoneService.list().subscribe((res) => this.zones.set(res.data));
    this.loadData();
  }

  private buildFilters(): ReportFilters {
    const filters: ReportFilters = {};
    if (this.filterSpecies()) filters.species_id = Number(this.filterSpecies());
    if (this.filterZone()) filters.zone_id = Number(this.filterZone());
    return filters;
  }

  loadData() {
    this.loading.set(true);
    this.error.set('');

    const filters = this.buildFilters();

    this.reportsService.getSurvivalRate(filters).subscribe({
      next: (res) => {
        this.report.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar reportes');
        this.loading.set(false);
      },
    });

    this.reportsService.getSpeciesStats(filters).subscribe({
      next: (res) => {
        this.speciesStats.set(res.data);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar estadísticas por especie');
        this.loading.set(false);
      },
    });

    this.reportsService.getZoneSummary(filters).subscribe({
      next: (res) => this.zoneSummary.set(res.data),
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar resumen por zona');
        this.loading.set(false);
      },
    });
  }

  downloadPdf() {
    this.downloading.set(true);
    const filters = this.buildFilters();

    this.reportsService.exportPdf(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-plantaciones-${Date.now()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: () => {
        this.downloading.set(false);
      },
    });
  }

  private renderCharts() {
    this.renderSurvivalChart();
    this.renderSpeciesChart();
  }

  private renderSurvivalChart() {
    const r = this.report();
    if (!r) return;

    const canvas = this.survivalChartRef();
    if (!canvas) return;

    this.survivalChart?.destroy();

    this.survivalChart = new Chart(canvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Vivas', 'Estresadas', 'Muertas', 'Sin monitoreo'],
        datasets: [{
          data: [r.overall.alive, r.overall.struggling, r.overall.dead, r.overall.unmonitored],
          backgroundColor: ['#2d6a4f', '#e9c46a', '#d62828', '#adb5bd'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  private renderSpeciesChart() {
    const stats = this.speciesStats();
    if (stats.length === 0) return;

    const canvas = this.speciesChartRef();
    if (!canvas) return;

    this.speciesChart?.destroy();

    const labels = stats.map((s) => s.common_name);
    const alive = stats.map((s) => s.alive);
    const struggling = stats.map((s) => s.struggling);
    const dead = stats.map((s) => s.dead);

    this.speciesChart = new Chart(canvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Vivas', data: alive, backgroundColor: '#2d6a4f' },
          { label: 'Estresadas', data: struggling, backgroundColor: '#e9c46a' },
          { label: 'Muertas', data: dead, backgroundColor: '#d62828' },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true },
        },
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  rate(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  }

  progressClass(value: number, total: number): string {
    const pct = this.rate(value, total);
    if (pct >= 70) return 'bg-success';
    if (pct >= 40) return 'bg-warning';
    return 'bg-danger';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { alive: 'Vivas', struggling: 'Estresadas', dead: 'Muertas' };
    return map[status] || status;
  }
}
