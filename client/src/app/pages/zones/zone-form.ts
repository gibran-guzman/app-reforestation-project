import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ZoneService } from '../../services/zone.service';
import type { Zone } from '../../models';

@Component({
  selector: 'app-zone-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './zone-form.html',
})
export default class ZoneForm implements OnInit {
  private service = inject(ZoneService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  id = 0;
  loading = false;
  saving = false;
  error = '';

  form = {
    name: '',
    description: '',
  };

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = Number(idParam);
      this.loading = true;
      this.service.getById(this.id).subscribe({
        next: (res) => {
          this.form = { name: res.data.name, description: res.data.description || '' };
          this.loading = false;
        },
        error: (err) => { this.error = err.error?.error || 'Error al cargar zona'; this.loading = false; },
      });
    }
  }

  submit() {
    this.error = '';
    this.saving = true;

    const obs = this.isEdit
      ? this.service.update(this.id, { name: this.form.name, description: this.form.description || undefined })
      : this.service.create({
          name: this.form.name,
          description: this.form.description || undefined,
        });

    obs.subscribe({
      next: () => this.router.navigate(['/zones']),
      error: (err) => {
        this.error = err.error?.error || 'Error al guardar';
        this.saving = false;
      },
    });
  }
}
