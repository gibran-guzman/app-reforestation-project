import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SpeciesService } from '../../services/species.service';
import type { Species } from '../../models';

@Component({
  selector: 'app-species-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './species-form.html',
})
export default class SpeciesForm implements OnInit {
  private service = inject(SpeciesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  id = 0;
  loading = false;
  saving = false;
  error = '';

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
      this.loading = true;
      this.service.getById(this.id).subscribe({
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
          this.loading = false;
        },
        error: (err) => { this.error = err.error?.error || 'Error al cargar especie'; this.loading = false; },
      });
    }
  }

  submit() {
    this.error = '';
    this.saving = true;

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

    obs.subscribe({
      next: () => this.router.navigate(['/species']),
      error: (err) => {
        this.error = err.error?.error || err.error?.details?.[0]?.message || 'Error al guardar';
        this.saving = false;
      },
    });
  }
}
