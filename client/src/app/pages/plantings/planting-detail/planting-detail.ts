import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PlantingService } from '../../../services/planting.service';
import { MonitoringService } from '../../../services/monitoring.service';
import type { PlantingSite, MonitoringRecord } from '../../../models';

@Component({
  selector: 'app-planting-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './planting-detail.html',
  styleUrl: './planting-detail.scss',
})
export default class PlantingDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private plantingService = inject(PlantingService);
  private monitoringService = inject(MonitoringService);

  planting = signal<PlantingSite | null>(null);
  monitoring = signal<MonitoringRecord[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('ID de plantación inválido');
      this.loading.set(false);
      return;
    }
    this.plantingService.getById(id).subscribe({
      next: (res) => {
        this.planting.set(res.data);
        this.loadMonitories(id);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar la plantación');
        this.loading.set(false);
      },
    });
  }

  private loadMonitories(plantingSiteId: number) {
    this.monitoringService.getByPlantingSiteId(plantingSiteId).subscribe({
      next: (res) => {
        this.monitoring.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar el historial de monitoreo');
        this.loading.set(false);
      },
    });
  }

  survivalBadge(status: string): string {
    const map: Record<string, string> = { alive: 'bg-success', struggling: 'bg-warning text-dark', dead: 'bg-danger' };
    return map[status] || 'bg-secondary';
  }

  survivalLabel(status: string): string {
    const map: Record<string, string> = { alive: 'Vivo', struggling: 'Estresado', dead: 'Muerto' };
    return map[status] || status;
  }
}
