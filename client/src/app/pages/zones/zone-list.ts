import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ZoneService } from '../../services/zone.service';
import { AuthService } from '../../services/auth.service';
import { extractErrorMessage } from '../../helpers/api-error';
import type { Zone } from '../../models';

@Component({
  selector: 'app-zone-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './zone-list.html',
  styleUrl: './zone-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ZoneList implements OnInit {
  private service = inject(ZoneService);
  private destroyRef = inject(DestroyRef);
  protected auth = inject(AuthService);

  readonly zones = signal<Zone[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit() {
    this.service.list().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.zones.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Error al cargar zonas'));
        this.loading.set(false);
      },
    });
  }

  deleteZone(id: number) {
    if (!confirm('¿Eliminar esta zona?')) return;
    this.service.remove(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.zones.update(list => list.filter((z) => z.id !== id));
      },
      error: (err) => alert(extractErrorMessage(err, 'Error al eliminar')),
    });
  }
}
