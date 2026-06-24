import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SpeciesService } from '../../services/species.service';
import { extractErrorMessage } from '../../helpers/api-error';
import type { Species } from '../../models';

@Component({
  selector: 'app-species-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './species-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpeciesForm implements OnInit {
  private service = inject(SpeciesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  isEdit = false;
  id = 0;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  form = {
    scientific_name: '',
    common_name: '',
    description: '',
    ideal_soil_type: '',
    recommended_altitude_min: null as number | null,
    recommended_altitude_max: null as number | null,
  };

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = Number(idParam);
      this.loading.set(true);
      this.service.getById(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          const s = res.data;
          this.form = {
            scientific_name: s.scientific_name,
            common_name: s.common_name,
            description: s.description || '',
            ideal_soil_type: s.ideal_soil_type || '',
            recommended_altitude_min: s.recommended_altitude_min,
            recommended_altitude_max: s.recommended_altitude_max,
          };
          this.loading.set(false);
        },
        error: (err) => { this.error.set(extractErrorMessage(err, 'Error al cargar especie')); this.loading.set(false); },
      });
    }
  }

  submit() {
    this.error.set('');
    this.saving.set(true);

    const body = {
      scientific_name: this.form.scientific_name,
      common_name: this.form.common_name,
      description: this.form.description || undefined,
      ideal_soil_type: this.form.ideal_soil_type || undefined,
      recommended_altitude_min: this.form.recommended_altitude_min ?? undefined,
      recommended_altitude_max: this.form.recommended_altitude_max ?? undefined,
    };

    const obs = this.isEdit
      ? this.service.update(this.id, body)
      : this.service.create(body);

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/species']),
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Error al guardar'));
        this.saving.set(false);
      },
    });
  }
}
