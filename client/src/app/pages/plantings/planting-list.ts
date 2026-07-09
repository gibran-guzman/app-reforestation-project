import { ChangeDetectionStrategy, Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { PlantingService } from '../../services/planting.service';
import { extractErrorMessage } from '../../helpers/api-error';
import type { PlantingSite, PaginationMeta } from '../../models';

@Component({
  selector: 'app-planting-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './planting-list.html',
  styleUrl: './planting-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PlantingList implements OnInit {
  private service = inject(PlantingService);
  private destroyRef = inject(DestroyRef);
  plantings = signal<PlantingSite[]>([]);
  meta = signal<PaginationMeta | null>(null);
  loading = signal(true);
  error = signal('');
  currentPage = signal(1);
  photoErrors = signal<Record<number, boolean>>({});

  ngOnInit() {
    this.loadPage(1);
  }

  loadPage(page: number) {
    this.loading.set(true);
    this.currentPage.set(page);
    this.service.list(page).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (res) => {
        this.plantings.set(res.data);
        this.meta.set(res.meta);
      },
      error: (err) => {
        this.error.set(extractErrorMessage(err, 'Error al cargar plantaciones'));
      },
    });
  }

  zeroBasedPageRange(total: number): number[] {
    return Array.from({ length: total }, (_, i) => i);
  }
}
