import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PlantingService } from '../../../services/planting.service';
import { MonitoringService } from '../../../services/monitoring.service';
import { extractErrorMessage } from '../../../helpers/api-error';
import type { PlantingSite, MonitoringRecord } from '../../../models';

@Component({
  selector: 'app-planting-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './planting-detail.html',
  styleUrl: './planting-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PlantingDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private plantingService = inject(PlantingService);
  private monitoringService = inject(MonitoringService);
  private destroyRef = inject(DestroyRef);

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
    this.plantingService.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.planting.set(res.data);
        this.loadMonitoringRecords(id);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Error al cargar la plantación'));
        this.loading.set(false);
      },
    });
  }

  private loadMonitoringRecords(plantingSiteId: number) {
    this.monitoringService.getByPlantingSiteId(plantingSiteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.monitoring.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Error al cargar el historial de monitoreo'));
        this.loading.set(false);
      },
    });
  }

  formatCoords(p: PlantingSite | null): string {
    if (!p?.location?.coordinates) return '—';
    return `${p.location.coordinates[1]}, ${p.location.coordinates[0]}`;
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
