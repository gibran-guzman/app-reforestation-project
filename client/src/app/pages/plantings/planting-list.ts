import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PlantingService } from '../../services/planting.service';
import type { PlantingSite, PaginationMeta } from '../../models';

@Component({
  selector: 'app-planting-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './planting-list.html',
  styleUrl: './planting-list.scss',
})
export default class PlantingList implements OnInit {
  private service = inject(PlantingService);
  plantings = signal<PlantingSite[]>([]);
  meta = signal<PaginationMeta | null>(null);
  loading = signal(true);
  error = signal('');
  currentPage = signal(1);

  ngOnInit() {
    this.loadPage(1);
  }

  loadPage(page: number) {
    this.loading.set(true);
    this.currentPage.set(page);
    this.service.list(page).subscribe({
      next: (res) => {
        this.plantings.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.error || 'Error al cargar plantaciones');
        this.loading.set(false);
      },
    });
  }

  pageArray(total: number): number[] {
    return Array.from({ length: total }, (_, i) => i);
  }
}
