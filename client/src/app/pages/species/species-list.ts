import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { SpeciesService } from '../../services/species.service';
import { AuthService } from '../../services/auth.service';
import { extractErrorMessage } from '../../helpers/api-error';
import type { Species } from '../../models';

@Component({
  selector: 'app-species-list',
  imports: [RouterLink],
  templateUrl: './species-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpeciesList implements OnInit {
  private service = inject(SpeciesService);
  private destroyRef = inject(DestroyRef);
  protected auth = inject(AuthService);

  readonly species = signal<Species[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit() {
    this.service.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.species.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Error al cargar especies'));
        this.loading.set(false);
      },
    });
  }

  deleteSpecies(id: number) {
    if (!confirm('¿Eliminar esta especie?')) return;
    this.service.remove(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.species.update(list => list.filter((s) => s.id !== id));
      },
      error: (err) => alert(extractErrorMessage(err, 'Error al eliminar')),
    });
  }
}
