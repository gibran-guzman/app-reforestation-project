import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlantingService } from '../../../services/planting.service';
import { MonitoringService } from '../../../services/monitoring.service';
import { extractErrorMessage } from '../../../helpers/api-error';
import type { PlantingSite, MonitoringRecord } from '../../../models';

@Component({
  selector: 'app-planting-detail',
  imports: [RouterLink, DatePipe, FormsModule],
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
  showForm = signal(false);
  saving = signal(false);
  saveError = signal('');

  monForm = {
    visit_date: new Date().toISOString().split('T')[0],
    survival_status: 'alive',
    ph: '',
    humidity: '',
    soil_texture: '',
    vigor: '',
    notes: '',
  };

  readonly soilTextures = [
    { value: 'sandy', label: 'Arenoso' },
    { value: 'loamy', label: 'Franco' },
    { value: 'clay', label: 'Arcilloso' },
    { value: 'silty', label: 'Limoso' },
    { value: 'peaty', label: 'Turboso' },
    { value: 'chalky', label: 'Calcáreo' },
  ];

  readonly survivalStatuses = [
    { value: 'alive', label: 'Viva' },
    { value: 'struggling', label: 'Estresada' },
    { value: 'dead', label: 'Muerta' },
  ];

  readonly vigorLevels = [
    { value: 'high', label: 'Alto' },
    { value: 'medium', label: 'Medio' },
    { value: 'low', label: 'Bajo' },
  ];

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

  openForm() {
    const plantingId = this.planting()?.id;
    if (!plantingId) return;
    this.monForm = {
      visit_date: new Date().toISOString().split('T')[0],
      survival_status: 'alive',
      ph: '',
      humidity: '',
      soil_texture: '',
      vigor: '',
      notes: '',
    };
    this.saveError.set('');
    this.showForm.set(true);
  }

  createMonitoring() {
    const plantingId = this.planting()?.id;
    if (!plantingId) return;
    if (!this.monForm.survival_status) return;

    this.saving.set(true);
    this.saveError.set('');
    this.monitoringService.create({
      planting_site_id: plantingId,
      visit_date: this.monForm.visit_date,
      survival_status: this.monForm.survival_status as 'alive' | 'struggling' | 'dead',
      ph: this.monForm.ph ? Number(this.monForm.ph) : undefined,
      humidity: this.monForm.humidity ? Number(this.monForm.humidity) : undefined,
      soil_texture: this.monForm.soil_texture || undefined,
      vigor: (this.monForm.vigor || undefined) as 'high' | 'medium' | 'low' | undefined,
      notes: this.monForm.notes || undefined,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.loadMonitoringRecords(plantingId);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(extractErrorMessage(err, 'Error al registrar monitoreo'));
      },
    });
  }

  cancelForm() {
    this.showForm.set(false);
    this.saveError.set('');
  }
}
