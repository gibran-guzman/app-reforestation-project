import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ZoneService } from '../../services/zone.service';
import { extractErrorMessage } from '../../helpers/api-error';
import type { Zone } from '../../models';

@Component({
  selector: 'app-zone-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './zone-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ZoneForm implements OnInit {
  private service = inject(ZoneService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  isEdit = false;
  id = 0;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');

  form = {
    name: '',
    description: '',
  };

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEdit = true;
      this.id = Number(idParam);
      this.loading.set(true);
      this.service.getById(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          this.form = { name: res.data.name, description: res.data.description || '' };
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(extractErrorMessage(err, 'Error al cargar zona'));
          this.loading.set(false);
        },
      });
    }
  }

  submit() {
    this.error.set('');
    this.saving.set(true);

    const obs = this.isEdit
      ? this.service.update(this.id, { name: this.form.name, description: this.form.description || undefined })
      : this.service.create({
          name: this.form.name,
          description: this.form.description || undefined,
        });

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/zones']),
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Error al guardar'));
        this.saving.set(false);
      },
    });
  }
}
