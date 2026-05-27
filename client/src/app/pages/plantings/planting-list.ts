import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PlantingService } from '../../services/planting.service';
import type { PlantingSite } from '../../models';

@Component({
  selector: 'app-planting-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './planting-list.html',
  styleUrl: './planting-list.scss',
})
export default class PlantingList implements OnInit {
  private service = inject(PlantingService);
  plantings: PlantingSite[] = [];
  loading = true;
  error = '';

  ngOnInit() {
    this.service.list().subscribe({
      next: (res) => { this.plantings = res.data; this.loading = false; },
      error: (err) => { this.error = err.error?.error || 'Error al cargar plantaciones'; this.loading = false; },
    });
  }
}
